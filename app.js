// DEPRECATED: This file is no longer used.
// The actual app code is in: src/app.js
// This file can be safely deleted.

// Switch view from Login to App
function showApp(username) {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    userDisplay.innerText = username;
    updateUI();
}

// Switch view from App to Login
function logout() {
    localStorage.removeItem('activeUser');
    appSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    loginForm.reset();
}

// Add a new expense
function addExpense(e) {
    e.preventDefault(); // Prevent page refresh

    const name = expenseNameInput.value.trim();
    const cost = parseFloat(expenseCostInput.value);

    // Basic validation
    if (name === '' || isNaN(cost) || cost <= 0) return;

    // Create expense object
    const expense = {
        id: generateID(),
        name: name,
        amount: cost
    };

    expenses.push(expense);
    updateUI();

    // Clear form inputs
    expenseNameInput.value = '';
    expenseCostInput.value = '';
}

// Delete an expense
function removeExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    updateUI();
}

// Update the DOM and LocalStorage
function updateUI() {
    // 1. Clear the current list
    expenseList.innerHTML = '';

    // 2. Add all expenses to the DOM
    expenses.forEach(expense => {
        const li = document.createElement('li');
        li.classList.add('expense-item');
        li.innerHTML = `
            <span>${expense.name}</span>
            <div>
                <span>$${expense.amount.toFixed(2)}</span>
                <button class="delete-btn" onclick="removeExpense(${expense.id})">X</button>
            </div>
        `;
        expenseList.appendChild(li);
    });

    // 3. Calculate and display total
    const total = expenses.reduce((acc, current) => acc + current.amount, 0);
    totalAmountDisplay.innerText = `$${total.toFixed(2)}`;

    // 4. Save to Local Storage
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Helper: Generate a random ID for expenses
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// --- Event Listeners ---

// Handle Login
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (username) {
        localStorage.setItem('activeUser', username);
        showApp(username);
    }
});

// Handle Logout
logoutBtn.addEventListener('click', logout);

// Handle Adding Expenses
expenseForm.addEventListener('submit', addExpense);

// Run initialization on load
init();