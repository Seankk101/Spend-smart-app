// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const userDisplay = document.getElementById('user-display');
const expenseForm = document.getElementById('expense-form');
const expenseNameInput = document.getElementById('expense-name');
const expenseCostInput = document.getElementById('expense-cost');
const expenseList = document.getElementById('expense-list');
const totalAmountDisplay = document.getElementById('total-amount');

// --- State ---
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let nextId = parseInt(localStorage.getItem('nextId')) || 1;
let currentUser = null;
let isOnline = navigator.onLine;

// Monitor online/offline status
window.addEventListener('online', () => {
    isOnline = true;
    console.log('App is online - syncing with Firebase...');
    if (currentUser) syncDataToFirebase();
});

window.addEventListener('offline', () => {
    isOnline = false;
    console.log('App is offline - using local storage');
});

// --- Toggle visibility ---
const toggleView = (show, hide) => {
    show.classList.remove('hidden');
    hide.classList.add('hidden');
};

// --- Initialize on load ---
const init = () => {
    const user = localStorage.getItem('activeUser');
    if (user) {
        currentUser = user;
        showApp(user);
    } else {
        toggleView(loginSection, appSection);
    }
};

// --- Show app dashboard ---
const showApp = (username) => {
    currentUser = username;
    toggleView(appSection, loginSection);
    userDisplay.innerText = username;
    updateUI();
    
    // Sync data from Firebase if online
    if (isOnline) {
        loadDataFromFirebase();
    }
};

// --- Logout ---
const logout = () => {
    currentUser = null;
    localStorage.removeItem('activeUser');
    toggleView(loginSection, appSection);
    loginForm.reset();
};

// --- Add expense ---
const addExpense = (e) => {
    e.preventDefault();
    const name = expenseNameInput.value.trim();
    const cost = parseFloat(expenseCostInput.value);
    
    if (!name || isNaN(cost) || cost <= 0) return;
    
    const expense = { 
        id: nextId++, 
        name, 
        amount: cost,
        createdAt: new Date().toISOString()
    };
    
    expenses.push(expense);
    expenseNameInput.value = '';
    expenseCostInput.value = '';
    updateUI();
    
    // Sync to Firebase if online
    if (isOnline && currentUser) {
        addExpenseToFirebase(expense);
    }
};

// --- Remove expense ---
const removeExpense = (id) => {
    const expense = expenses.find(e => e.id === id);
    expenses = expenses.filter(e => e.id !== id);
    updateUI();
    
    // Delete from Firebase if online
    if (isOnline && currentUser && expense) {
        deleteExpenseFromFirebase(id);
    }
};

// --- Render expense list and update total ---
const updateUI = () => {
    expenseList.innerHTML = '';
    
    expenses.forEach(expense => {
        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `
            <span>${expense.name}</span>
            <div>
                <span>$${expense.amount.toFixed(2)}</span>
                <button class="delete-btn" data-id="${expense.id}">X</button>
            </div>
        `;
        expenseList.appendChild(li);
    });
    
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalAmountDisplay.innerText = `$${total.toFixed(2)}`;
    
    // Save to localStorage
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('nextId', nextId);
};

// --- Event delegation for delete buttons ---
expenseList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        removeExpense(parseInt(e.target.dataset.id));
    }
});

// --- Event listeners ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (username && password.length >= 4) {
        localStorage.setItem('activeUser', username);
        loginForm.reset();
        showApp(username);
    } else {
        alert('Password must be at least 4 characters');
    }
});

document.getElementById('logout-btn').addEventListener('click', logout);
expenseForm.addEventListener('submit', addExpense);

// --- Clear all data ---
document.getElementById('clear-data-btn')?.addEventListener('click', () => {
    if (confirm('Clear all expenses and reset?')) {
        localStorage.clear();
        expenses = [];
        nextId = 1;
        logout();
    }
});

// --- Export expenses to JSON file ---
const exportData = () => {
    const data = {
        expenses: expenses,
        exportDate: new Date().toISOString(),
        username: currentUser,
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendsmart-export-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Expenses exported successfully!');
};

// --- Import expenses from JSON file ---
const importData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.expenses && Array.isArray(data.expenses)) {
                expenses = data.expenses;
                nextId = Math.max(...expenses.map(exp => exp.id), 0) + 1;
                updateUI();
                
                // Sync imported data to Firebase if online
                if (isOnline && currentUser) {
                    syncDataToFirebase();
                }
                
                alert(`Imported ${expenses.length} expenses successfully!`);
            } else {
                alert('Invalid file format. Please use an exported SpendSmart file.');
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);
};

// --- Export button handler ---
document.getElementById('export-btn')?.addEventListener('click', exportData);

// --- Import button handler ---
document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file').click();
});

// --- Import file input handler ---
document.getElementById('import-file')?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        importData(e.target.files[0]);
        e.target.value = ''; // Reset input
    }
});

// --- Firebase Integration Functions (Placeholder for future use) ---
// These will be implemented with proper Firebase setup using Node.js backend
const addExpenseToFirebase = (expense) => {
    console.log('Adding expense to Firebase:', expense);
    // TODO: Implement Firebase add
};

const deleteExpenseFromFirebase = (id) => {
    console.log('Deleting expense from Firebase:', id);
    // TODO: Implement Firebase delete
};

const syncDataToFirebase = () => {
    console.log('Syncing all data to Firebase...');
    // TODO: Implement Firebase sync
};

const loadDataFromFirebase = () => {
    console.log('Loading data from Firebase...');
    // TODO: Implement Firebase load
};

// --- Initialize ---
init();
