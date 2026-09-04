"use strict";

const bakeryProducts = [
    { id: "signature-loaf", name: "Signature Loaf", category: "Bread" },
    { id: "focaccia", name: "Rosemary Sea Salt Focaccia", category: "Bread" },
    { id: "butter-croissant", name: "Butter Croissant", category: "Pastry" }
];

const storageKeys = {
    favorites: "northStarBakeryFavorites",
    preorderDraft: "northStarBakeryPreorderDraft"
};

function readStoredArray(key) {
    try {
        const storedValue = JSON.parse(localStorage.getItem(key));
        return Array.isArray(storedValue) ? storedValue : [];
    } catch (error) {
        return [];
    }
}

function saveFavorites(favoriteIds) {
    localStorage.setItem(storageKeys.favorites, JSON.stringify(favoriteIds));
}

function getProduct(productId) {
    return bakeryProducts.find((product) => product.id === productId);
}

function renderFavorites(favoriteIds) {
    const favoritesList = document.querySelector("#favorites-list");
    const clearButton = document.querySelector("#clear-favorites");
    if (!favoritesList || !clearButton) {
        return;
    }

    favoritesList.replaceChildren();
    if (favoriteIds.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = "No favorites saved yet.";
        favoritesList.append(emptyItem);
        clearButton.disabled = true;
    } else {
        favoriteIds.forEach((productId) => {
            const product = getProduct(productId);
            if (product) {
                const listItem = document.createElement("li");
                listItem.textContent = `${product.name} — ${product.category}`;
                favoritesList.append(listItem);
            }
        });
        clearButton.disabled = false;
    }

    document.querySelectorAll(".favorite-button").forEach((button) => {
        const product = getProduct(button.dataset.productId);
        const isSaved = favoriteIds.includes(button.dataset.productId);
        button.setAttribute("aria-pressed", String(isSaved));
        button.textContent = `${isSaved ? "Remove" : "Save"} ${product.name}`;
    });
}

function toggleFavorite(productId) {
    const favoriteIds = readStoredArray(storageKeys.favorites);
    const product = getProduct(productId);
    const isSaved = favoriteIds.includes(productId);
    const updatedIds = isSaved
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId];

    saveFavorites(updatedIds);
    renderFavorites(updatedIds);
    const status = document.querySelector("#favorites-status");
    status.textContent = `${product.name} was ${isSaved ? "removed from" : "added to"} your saved favorites.`;
}

function initializeFavorites() {
    if (!document.querySelector("#favorites-list")) {
        return;
    }

    const favoriteIds = readStoredArray(storageKeys.favorites);
    renderFavorites(favoriteIds);
    document.querySelectorAll(".favorite-button").forEach((button) => {
        button.addEventListener("click", () => toggleFavorite(button.dataset.productId));
    });
    document.querySelector("#clear-favorites").addEventListener("click", () => {
        saveFavorites([]);
        renderFavorites([]);
        document.querySelector("#favorites-status").textContent = "Your saved favorites were cleared.";
    });
}

function showFieldError(field, message) {
    const errorElement = document.querySelector(`#${field.id}-error`);
    field.closest(".field").classList.toggle("has-error", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function validatePreorderForm(form) {
    const fields = {
        name: form.elements.name,
        email: form.elements.email,
        pickupDate: form.elements["pickup-date"],
        requestType: form.elements["request-type"],
        itemDetails: form.elements["item-details"]
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = fields.pickupDate.value ? new Date(`${fields.pickupDate.value}T00:00:00`) : null;
    const messages = {
        name: fields.name.value.trim().length >= 2 ? "" : "Enter your full name using at least 2 characters.",
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim()) ? "" : "Enter a complete email address, such as name@example.com.",
        pickupDate: !selectedDate ? "Choose a requested pickup date." : selectedDate < today ? "Choose today or a future pickup date." : "",
        requestType: fields.requestType.value ? "" : "Choose the type of request you are making.",
        itemDetails: fields.itemDetails.value.trim().length >= 10 ? "" : "Describe the items and quantities using at least 10 characters."
    };

    Object.entries(fields).forEach(([key, field]) => showFieldError(field, messages[key]));
    return Object.values(messages).every((message) => message === "");
}

function collectDraft(form) {
    return {
        name: form.elements.name.value,
        email: form.elements.email.value,
        pickupDate: form.elements["pickup-date"].value,
        requestType: form.elements["request-type"].value,
        itemDetails: form.elements["item-details"].value,
        allergyNotes: form.elements["allergy-notes"].value
    };
}

function saveDraft(form) {
    localStorage.setItem(storageKeys.preorderDraft, JSON.stringify(collectDraft(form)));
}

function restoreDraft(form) {
    let draft = null;
    try {
        draft = JSON.parse(localStorage.getItem(storageKeys.preorderDraft));
    } catch (error) {
        draft = null;
    }
    if (!draft || typeof draft !== "object") {
        return;
    }

    const draftFields = {
        name: "name",
        email: "email",
        pickupDate: "pickup-date",
        requestType: "request-type",
        itemDetails: "item-details",
        allergyNotes: "allergy-notes"
    };
    Object.entries(draftFields).forEach(([property, fieldName]) => {
        if (typeof draft[property] === "string") {
            form.elements[fieldName].value = draft[property];
        }
    });
    document.querySelector("#draft-restored").hidden = false;
}

function initializePreorderForm() {
    const form = document.querySelector("#preorder-form");
    if (!form) {
        return;
    }

    restoreDraft(form);
    form.addEventListener("input", () => saveDraft(form));
    form.addEventListener("change", () => saveDraft(form));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const isValid = validatePreorderForm(form);
        const status = document.querySelector("#form-status");
        if (isValid) {
            saveDraft(form);
            status.textContent = "Your request details are complete and ready for the bakery to review.";
        } else {
            status.textContent = "Please correct the highlighted fields. Your other information has been kept.";
            const firstInvalid = form.querySelector('[aria-invalid="true"]');
            firstInvalid.focus();
        }
    });
    document.querySelector("#clear-draft").addEventListener("click", () => {
        localStorage.removeItem(storageKeys.preorderDraft);
        form.reset();
        form.querySelectorAll(".error-message").forEach((element) => { element.textContent = ""; });
        form.querySelectorAll(".field").forEach((element) => element.classList.remove("has-error"));
        form.querySelectorAll("[aria-invalid]").forEach((element) => element.removeAttribute("aria-invalid"));
        document.querySelector("#draft-restored").hidden = true;
        document.querySelector("#form-status").textContent = "Saved request details were cleared.";
    });
}

initializeFavorites();
initializePreorderForm();
