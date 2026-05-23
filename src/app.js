// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const phoneInput = document.getElementById('phone');
const otpSection = document.getElementById('otp-section');
const phoneConfirm = document.getElementById('phone-confirm');
const otpInput = document.getElementById('otp-input');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const resendOtpBtn = document.getElementById('resend-otp-btn');
const backToLoginBtn = document.getElementById('back-to-login-btn');
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
let pendingUser = null; // Store username/password temporarily during phone verification
let pendingPhone = null; // Store phone number during OTP verification

// Backend server URL
const SERVER_URL = 'http://localhost:3001';

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
    otpSection.classList.add('hidden');
};

// --- Send OTP via SMS ---
const sendOTP = async (phoneNumber) => {
    try {
        // Show loading state
        const btn = loginForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending code...';

        const response = await fetch(`${SERVER_URL}/api/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send OTP');
        }

        // Show OTP verification section
        otpSection.classList.remove('hidden');
        phoneConfirm.textContent = `Verification code sent to ...${data.phoneNumber}`;
        pendingPhone = phoneNumber;
        otpInput.focus();

        btn.disabled = false;
        btn.textContent = originalText;

    } catch (error) {
        alert('Error sending code: ' + error.message);
        const btn = loginForm.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.textContent = originalText;
    }
};

// --- Verify OTP ---
const verifyOTP = async (phoneNumber, otp) => {
    try {
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = 'Verifying...';

        const response = await fetch(`${SERVER_URL}/api/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber, otp })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to verify OTP');
        }

        // OTP verified successfully - login the user
        alert('Phone verified! Logging in...');
        localStorage.setItem('activeUser', pendingUser);
        localStorage.setItem('userPhone', pendingPhone);
        
        // Clear form
        loginForm.reset();
        otpInput.value = '';
        otpSection.classList.add('hidden');
        pendingUser = null;
        pendingPhone = null;

        showApp(pendingUser || usernameInput.value);

        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify Code';

    } catch (error) {
        alert('Verification failed: ' + error.message);
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify Code';
    }
};

// --- Resend OTP ---
const resendOTP = async () => {
    try {
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = 'Sending...';

        const response = await fetch(`${SERVER_URL}/api/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber: pendingPhone })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to resend OTP');
        }

        alert('New code sent!');
        otpInput.value = '';
        otpInput.focus();

        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = 'Resend Code';

    } catch (error) {
        alert('Error: ' + error.message);
        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = 'Resend Code';
    }
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
// Login form submission - now sends OTP instead of direct login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!username || password.length < 4 || !phone) {
        alert('Please fill all fields. Password must be at least 4 characters.');
        return;
    }
    
    // Store for OTP verification
    pendingUser = username;
    
    // Send OTP
    sendOTP(phone);
});

// Verify OTP button
verifyOtpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const otp = otpInput.value.trim();
    
    if (otp.length !== 6 || isNaN(otp)) {
        alert('Please enter a valid 6-digit code');
        return;
    }
    
    verifyOTP(pendingPhone, otp);
});

// Resend OTP button
resendOtpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resendOTP();
});

// Back to login button
backToLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    otpSection.classList.add('hidden');
    loginForm.reset();
    otpInput.value = '';
    pendingUser = null;
    pendingPhone = null;
    usernameInput.focus();
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

// --- Firebase Integration Functions ---
// These are placeholders for Firebase backend integration
// Currently the app works fully offline with localStorage
const addExpenseToFirebase = (expense) => {
    console.log('Firebase: Adding expense', expense);
    // TODO: Implement with Node.js/Express backend
};

const deleteExpenseFromFirebase = (id) => {
    console.log('Firebase: Deleting expense', id);
    // TODO: Implement with Node.js/Express backend
};

const syncDataToFirebase = () => {
    console.log('Firebase: Syncing data to backend...');
    // TODO: Implement full sync
};

const loadDataFromFirebase = () => {
    console.log('Firebase: Loading data from backend...');
    // TODO: Implement data load
};

// --- Initialize ---
init();
