/**
 * Objectives and TTPs Management Module
 * Handles UI updates and management of selected objectives and TTPs
 */

// Update UI with current objectives and TTPs
function updateObjectivesAndTTPsUI() {
    // Populate the objectives in the UI
    const objectivesContainer = document.getElementById('objectives-container');
    if (objectivesContainer && objectivesList.length > 0) {
        objectivesContainer.innerHTML = objectivesList.map((obj, index) => `
            <div class="objective-entry">
                <label>Objective ${index + 1}:</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="flex: 1; padding: 8px; background: #f0f8ff; border: 1px solid #ddd; border-radius: 4px;">${obj}</span>
                    <button type="button" class="remove-button" onclick="removeObjectiveFromList(${index})">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Populate the TTPs in the UI
    const ttpsContainer = document.getElementById('ttps-container');
    if (ttpsContainer && ttpsList.length > 0) {
        ttpsContainer.innerHTML = ttpsList.map((ttp, index) => `
            <div class="ttp-entry">
                <label>TTP ${index + 1}:</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="flex: 1; padding: 8px; background: #fff5f5; border: 1px solid #ddd; border-radius: 4px;">${ttp}</span>
                    <button type="button" class="remove-button" onclick="removeTTPFromList(${index})">Remove</button>
                </div>
            </div>
        `).join('');
        
        // Remove the "Add TTP" button after populating
        const addTTPButton = document.getElementById('addTTPButton');
        if (addTTPButton) {
            addTTPButton.style.display = 'none';
        }
    }
}

// Remove objective from list by index
function removeObjectiveFromList(index) {
    if (index >= 0 && index < objectivesList.length) {
        const removedObj = objectivesList.splice(index, 1)[0];
        updateObjectivesAndTTPsUI();
        updateSelectionInfo();
        console.log(`Removed objective: ${removedObj}`);
    }
}

// Remove TTP from list by index
function removeTTPFromList(index) {
    if (index >= 0 && index < ttpsList.length) {
        const removedTTP = ttpsList.splice(index, 1)[0];
        updateObjectivesAndTTPsUI();
        updateSelectionInfo();
        console.log(`Removed TTP: ${removedTTP}`);
        
        // Show the "Add TTP" button if all TTPs are removed
        if (ttpsList.length === 0) {
            const addTTPButton = document.getElementById('addTTPButton');
            if (addTTPButton) {
                addTTPButton.style.display = 'block';
            }
        }
    }
}