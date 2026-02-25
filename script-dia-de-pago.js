// ===== CONFIGURATION =====
const CONFIG = {
    MIN_AMOUNT: 10,
    MAX_AMOUNT: 10000,
    MAX_INPUT_AMOUNT: 100000000, // Límite máximo para entrada
    MAX_DECIMALS: 2,
    INSTALLMENTS_OPTIONS: [1, 3, 6, 9, 12, 18, 24],
    // Tasas de interés placeholder (TEA - Tasa Efectiva Anual en %)
    // TODO: Reemplazar con tasas reales cuando se proporcionen
    INTEREST_RATES: {
        1: 0,      // Sin interés para 1 cuota
        3: 15,     // 15% TEA
        6: 25,     // 25% TEA
        9: 35,     // 35% TEA
        12: 45,    // 45% TEA
        18: 55,    // 55% TEA
        24: 65     // 65% TEA
    }
};

// ===== STATE =====
let currentAmount = '';
let selectedAmount = 0;
let selectedInstallments = 0;
let selectedCalculation = null;
let currentScreen = 'calculator';

// ===== DOM ELEMENTS =====
// Calculator screen
const screenCalculator = document.getElementById('screenCalculator');
const amountDisplay = document.querySelector('.amount-display');
const amountValueEl = document.getElementById('amountValue');
const btnContinue = document.getElementById('btnContinue');
const btnPreset = document.getElementById('btnPreset');
const installmentInfo = document.getElementById('installmentInfo');
const helperValue = document.querySelector('.helper-value');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const keys = document.querySelectorAll('.key');

// Installments screen
const screenInstallments = document.getElementById('screenInstallments');
const btnBackInstallments = document.getElementById('btnBackInstallments');
const amountRequested = document.getElementById('amountRequested');
const installmentsList = document.getElementById('installmentsList');

// Review screen
const screenReview = document.getElementById('screenReview');
const btnBackReview = document.getElementById('btnBackReview');
const reviewAmountReceived = document.getElementById('reviewAmountReceived');
const reviewInterest = document.getElementById('reviewInterest');
const reviewIVA = document.getElementById('reviewIVA');
const reviewTotalReturn = document.getElementById('reviewTotalReturn');
const reviewPaymentPlan = document.getElementById('reviewPaymentPlan');
const reviewDueDate = document.getElementById('reviewDueDate');
const reviewTNA = document.getElementById('reviewTNA');
const reviewTEA = document.getElementById('reviewTEA');
const reviewCFTEA = document.getElementById('reviewCFTEA');
const btnAccept = document.getElementById('btnAccept');
const btnViewPaymentPlan = document.getElementById('btnViewPaymentPlan');
const reviewContainer = document.querySelector('.review-container');
const reviewAction = document.querySelector('.review-action');

// Feedback screen
const screenFeedback = document.getElementById('screenFeedback');
const btnClose = document.getElementById('btnClose');
const feedbackAmount = document.getElementById('feedbackAmount');
const feedbackDueDate = document.getElementById('feedbackDueDate');
const btnGoToMoney = document.getElementById('btnGoToMoney');
const btnGoToHome = document.getElementById('btnGoToHome');

// State for button unlock
let isButtonUnlocked = false;

// ===== INITIALIZATION =====
function init() {
    // Set max amount in helper text
    helperValue.textContent = `$ ${formatCurrency(CONFIG.MAX_AMOUNT)}`;
    btnPreset.textContent = `$ ${formatCurrency(CONFIG.MAX_AMOUNT)}`;

    // Add keyboard event listeners
    keys.forEach(key => {
        key.addEventListener('click', handleKeyPress);
    });

    // Add preset button listener
    btnPreset.addEventListener('click', handlePresetClick);

    // Add continue button listener
    btnContinue.addEventListener('click', handleContinue);

    // Add back button listener
    btnBackInstallments.addEventListener('click', handleBackToCalculator);

    // Add improve offer button listener
    // Add review screen listeners
    btnBackReview.addEventListener('click', handleBackToInstallments);
    btnAccept.addEventListener('click', handleAccept);
    btnViewPaymentPlan.addEventListener('click', handleViewPaymentPlan);

    // Add scroll listener for review container
    if (reviewContainer) {
        reviewContainer.addEventListener('scroll', handleReviewScroll);
    }

    // Add feedback screen listeners
    btnClose.addEventListener('click', handleClose);
    btnGoToMoney.addEventListener('click', handleGoToMoney);
    btnGoToHome.addEventListener('click', handleGoToHome);

    // Initialize payment day description with default (day 7)
    const today = new Date();
    const defaultDay = 7;
    const firstPayment = new Date(today);
    firstPayment.setDate(defaultDay);

    // If the day already passed this month, move to next month
    if (firstPayment <= today) {
        firstPayment.setMonth(firstPayment.getMonth() + 1);
    }

    // Set initial description
    if (paymentDayDescription) {
        const monthAbbreviation = monthAbbr[firstPayment.getMonth()];
        paymentDayDescription.textContent = `Primera cuota el ${defaultDay}/${monthAbbreviation}.`;
    }

    // Update display
    updateDisplay();
}

// ===== SCREEN MANAGEMENT =====
const screenOrder = ['calculator', 'installments', 'review', 'feedback'];

function showScreen(screenName, direction = 'forward') {
    const screens = {
        calculator: screenCalculator,
        installments: screenInstallments,
        review: screenReview,
        feedback: screenFeedback
    };

    const currentScreenEl = screens[currentScreen];
    const nextScreenEl = screens[screenName];

    if (!nextScreenEl || currentScreen === screenName) return;

    // Determine if going forward or backward
    const currentIndex = screenOrder.indexOf(currentScreen);
    const nextIndex = screenOrder.indexOf(screenName);
    const isForward = direction === 'forward' || nextIndex > currentIndex;

    // Special celebratory animation for feedback screen
    if (screenName === 'feedback' && isForward) {
        // Add celebrating class for special animation
        nextScreenEl.classList.add('celebrating', 'active');

        // Fade out current screen
        if (currentScreenEl) {
            currentScreenEl.style.transition = 'opacity 0.3s ease-out';
            currentScreenEl.style.opacity = '0';
        }

        // Clean up after animation
        setTimeout(() => {
            if (currentScreenEl) {
                currentScreenEl.classList.remove('active');
                currentScreenEl.style.opacity = '';
                currentScreenEl.style.transition = '';
            }
        }, 300);

        currentScreen = screenName;
        return;
    }

    // Position next screen at starting point
    if (!isForward) {
        // Position at left without transition
        nextScreenEl.classList.add('from-left');

        // Force reflow
        nextScreenEl.offsetHeight;

        // Remove from-left to re-enable transitions, then activate
        nextScreenEl.classList.remove('from-left');
        nextScreenEl.classList.add('active');
    } else {
        // Forward: just activate (will slide from default right position)
        nextScreenEl.classList.add('active');
    }

    // Add exiting class to current screen
    if (currentScreenEl) {
        currentScreenEl.classList.add(isForward ? 'exiting' : 'exiting-back');
    }

    // Clean up after transition
    setTimeout(() => {
        if (currentScreenEl) {
            currentScreenEl.classList.remove('active', 'exiting', 'exiting-back', 'celebrating');
        }
    }, 400);

    currentScreen = screenName;
}

function handleBackToCalculator() {
    showScreen('calculator', 'backward');
}

function handleBackToInstallments() {
    showScreen('installments', 'backward');
}

// ===== KEYBOARD HANDLERS =====
function handleKeyPress(e) {
    const key = e.currentTarget.dataset.key;

    // Play haptic feedback (if supported)
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }

    if (key === 'delete') {
        handleDelete();
    } else {
        handleNumber(key);
    }

    updateDisplay();
}

function handleNumber(num) {
    // If starting with 0, replace it
    if (currentAmount === '0') {
        currentAmount = num;
        return;
    }

    // Add the number
    const newAmount = currentAmount + num;

    // Check if exceeds max input amount
    if (parseAmount(newAmount) > CONFIG.MAX_INPUT_AMOUNT) {
        return; // Exceeds max input amount
    }

    currentAmount = newAmount;
}

function handleDelete() {
    if (currentAmount === '') return;

    // Remove last character
    currentAmount = currentAmount.slice(0, -1);

    // If empty, reset to 0
    if (currentAmount === '') {
        currentAmount = '0';
    }
}

function handlePresetClick() {
    currentAmount = CONFIG.MAX_AMOUNT.toString();
    btnPreset.classList.add('selected');
    updateDisplay();

    // Play haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(20);
    }
}

// ===== DISPLAY UPDATES =====
function updateDisplay() {
    const amount = parseAmount(currentAmount);

    // Format display value
    const displayValue = formatDisplayAmount(currentAmount);
    amountValueEl.textContent = displayValue;

    // Adjust font size based on display length
    adjustFontSize(displayValue);

    // Validate amount and show appropriate error
    let hasError = false;
    let errorMsg = '';

    if (amount > 0 && amount < CONFIG.MIN_AMOUNT) {
        hasError = true;
        errorMsg = `Ingresa un monto mayor a $ ${formatCurrency(CONFIG.MIN_AMOUNT)}`;
    } else if (amount > CONFIG.MAX_AMOUNT) {
        hasError = true;
        errorMsg = `Ingresa un monto menor a $ ${formatCurrency(CONFIG.MAX_AMOUNT)}`;
    }

    // Show/hide error message
    if (hasError) {
        errorMessage.style.display = 'flex';
        errorText.textContent = errorMsg;
    } else {
        errorMessage.style.display = 'none';
    }

    // Update continue button state
    const isValid = amount >= CONFIG.MIN_AMOUNT && amount <= CONFIG.MAX_AMOUNT;
    btnContinue.disabled = !isValid;

    // Show/hide installment info
    if (amount >= CONFIG.MIN_AMOUNT && isValid) {
        installmentInfo.style.display = 'flex';
        const installmentText = document.querySelector('.installment-text');
        installmentText.textContent = `Pagarás en 24 cuotas.`;
    } else {
        installmentInfo.style.display = 'none';
    }

    // Update preset button selected state
    if (amount === CONFIG.MAX_AMOUNT) {
        btnPreset.classList.add('selected');
    } else {
        btnPreset.classList.remove('selected');
    }

    // Update cursor visibility
    updateCursor();
}

function adjustFontSize(displayValue) {
    // Calculate total length including currency symbol and dots
    const totalLength = displayValue.length;

    let fontSize = 56; // Default size

    // More aggressive scaling based on length
    if (totalLength >= 13) {
        fontSize = 20;
    } else if (totalLength >= 11) {
        fontSize = 24;
    } else if (totalLength >= 9) {
        fontSize = 32;
    } else if (totalLength >= 7) {
        fontSize = 40;
    } else if (totalLength >= 5) {
        fontSize = 48;
    }

    // Apply same font size to all elements
    amountDisplay.style.fontSize = `${fontSize}px`;

    // Currency symbol same size as amount
    const currencySymbol = document.querySelector('.currency-symbol');
    currencySymbol.style.fontSize = `${fontSize}px`;

    // Color logic: gray when amount is 0, primary color otherwise
    const amount = parseAmount(currentAmount);
    const color = (amount === 0) ? '#646587' : 'var(--color-text-primary)';

    currencySymbol.style.color = color;
    amountValueEl.style.color = color;

    // Safety check: measure actual width and scale down if needed
    setTimeout(() => {
        const containerWidth = amountDisplay.parentElement.offsetWidth;
        const displayWidth = amountDisplay.scrollWidth;

        if (displayWidth > containerWidth - 32) { // 32px margin safety
            const scale = (containerWidth - 32) / displayWidth;
            amountDisplay.style.transform = `scale(${Math.min(scale, 1)})`;
            amountDisplay.style.transformOrigin = 'left center';
        } else {
            amountDisplay.style.transform = 'scale(1)';
        }
    }, 0);
}

function formatDisplayAmount(amount) {
    if (!amount || amount === '0') {
        return '0';
    }

    // Add thousand separators with dot
    return amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatCurrency(amount) {
    // Format with dot for thousands separator
    return amount.toLocaleString('es-AR').replace(/,/g, '.');
}

function formatMoney(amount) {
    return amount.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseAmount(amount) {
    if (!amount) return 0;
    // Remove dots (thousand separators)
    const normalized = amount.replace(/\./g, '');
    return parseInt(normalized) || 0;
}

function updateCursor() {
    const cursor = document.querySelector('.cursor');
    const amount = parseAmount(currentAmount);

    // Show cursor only when amount is 0 or empty
    if (amount === 0 || currentAmount === '' || currentAmount === '0') {
        cursor.style.display = 'inline';
    } else {
        cursor.style.display = 'none';
    }
}

// ===== INSTALLMENTS CALCULATION =====
function calculateInstallment(principal, installments) {
    // Get base annual rate from config
    let annualRate = CONFIG.INTEREST_RATES[installments];

    // Apply payment day modifier if a day is selected
    if (selectedDay !== null) {
        const modifier = getPaymentDayModifier(selectedDay);
        annualRate = annualRate + modifier; // Add/subtract percentage points
        console.log(`Base rate: ${CONFIG.INTEREST_RATES[installments]}% + Modifier: ${modifier}% = ${annualRate}%`);
    }

    // Convert percentage to decimal
    annualRate = annualRate / 100;

    // Si es una sola cuota, no hay interés
    if (installments === 1) {
        return {
            installmentAmount: principal,
            totalAmount: principal,
            interestRate: 0
        };
    }

    // Convertir TEA a tasa mensual
    const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;

    // Calcular cuota usando fórmula de amortización francesa
    const installmentAmount = principal * (monthlyRate * Math.pow(1 + monthlyRate, installments)) /
                              (Math.pow(1 + monthlyRate, installments) - 1);

    const totalAmount = installmentAmount * installments;

    return {
        installmentAmount: Math.round(installmentAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        interestRate: annualRate * 100
    };
}

function formatInstallmentAmount(amount) {
    // Split amount into integer and decimal parts
    const parts = amount.toFixed(2).split('.');
    const integerPart = parseInt(parts[0]);
    const decimalPart = parts[1];

    // Format integer part with dot as thousands separator
    const formattedInteger = integerPart.toLocaleString('es-AR').replace(/,/g, '.');

    return {
        integer: formattedInteger,
        decimal: decimalPart
    };
}

function renderInstallmentsList() {
    installmentsList.innerHTML = '';

    CONFIG.INSTALLMENTS_OPTIONS.forEach(installments => {
        const calculation = calculateInstallment(selectedAmount, installments);
        const installmentFormatted = formatInstallmentAmount(calculation.installmentAmount);
        const totalFormatted = formatInstallmentAmount(calculation.totalAmount);

        const option = document.createElement('div');
        option.className = 'installment-option';
        option.dataset.installments = installments;

        option.innerHTML = `
            <div class="installment-left">
                <span class="installment-term">${installments}x $ ${installmentFormatted.integer}<sup class="installment-sup">${installmentFormatted.decimal}</sup></span>
            </div>
            <div class="installment-right">
                <div class="installment-total">
                    $ ${totalFormatted.integer}<sup class="installment-sup">${totalFormatted.decimal}</sup>
                </div>
                <svg class="installment-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;

        option.addEventListener('click', () => handleInstallmentSelect(installments, calculation));

        installmentsList.appendChild(option);
    });
}

function handleInstallmentSelect(installments, calculation) {
    console.log('handleInstallmentSelect called', installments, calculation);
    selectedInstallments = installments;
    selectedCalculation = calculation;

    // Play haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate([20, 10, 20]);
    }

    // Reset button state
    isButtonUnlocked = false;
    if (reviewAction) {
        reviewAction.classList.remove('sticky');
    }
    if (reviewContainer) {
        reviewContainer.classList.remove('has-sticky-button');
    }

    // Populate review screen
    console.log('Calling populateReviewScreen');
    populateReviewScreen();

    // Transition to review screen
    console.log('Calling showScreen(review)');
    showScreen('review');

    // Reset scroll position
    if (reviewContainer) {
        reviewContainer.scrollTop = 0;
    }
}

function populateReviewScreen() {
    // Amount received
    const amountFormatted = formatInstallmentAmount(selectedAmount);
    reviewAmountReceived.textContent = `$ ${amountFormatted.integer}`;

    // Calculate interest (total - principal)
    const interestAmount = selectedCalculation.totalAmount - selectedAmount;
    const interestFormatted = formatInstallmentAmount(interestAmount);
    reviewInterest.textContent = `$ ${interestFormatted.integer},${interestFormatted.decimal}`;

    // Calculate IVA (21% of interest)
    const ivaAmount = interestAmount * 0.21;
    const ivaFormatted = formatInstallmentAmount(ivaAmount);
    reviewIVA.textContent = `$ ${ivaFormatted.integer},${ivaFormatted.decimal}`;

    // Total to return (total + IVA)
    const totalReturn = selectedCalculation.totalAmount + ivaAmount;
    const totalReturnFormatted = formatInstallmentAmount(totalReturn);
    reviewTotalReturn.textContent = `$ ${totalReturnFormatted.integer},${totalReturnFormatted.decimal}`;

    // Payment plan
    const installmentFormatted = formatInstallmentAmount(selectedCalculation.installmentAmount);
    reviewPaymentPlan.textContent = `${selectedInstallments}x $ ${installmentFormatted.integer},${installmentFormatted.decimal}`;

    // Interest rates (with payment day modifier)
    let annualRate = CONFIG.INTEREST_RATES[selectedInstallments];
    if (selectedDay !== null) {
        const modifier = getPaymentDayModifier(selectedDay);
        annualRate = annualRate + modifier;
    }
    reviewTNA.textContent = `${annualRate.toFixed(2).replace('.', ',')}%`;
    reviewTEA.textContent = `${annualRate.toFixed(2).replace('.', ',')}%`;

    // CFT calculation (simplified - same as TEA for now)
    const cftRate = annualRate;
    reviewCFTEA.textContent = `${cftRate.toFixed(2).replace('.', ',')}%`;

    // Payment day
    const paymentDay = selectedDay !== null ? selectedDay : 7;
    reviewDueDate.textContent = `Tu fecha de pago es el ${paymentDay} de cada mes`;
}

function handleAccept() {
    console.log('Credit accepted');
    console.log('Amount:', selectedAmount);
    console.log('Installments:', selectedInstallments);
    console.log('Installment amount:', selectedCalculation.installmentAmount);

    // Play haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate([20, 10, 20]);
    }

    // Add loading state to button
    const btnText = btnAccept.querySelector('.btn-text');
    btnAccept.classList.add('loading');
    btnText.textContent = 'Procesando tu solicitud';

    // Simulate processing time
    setTimeout(() => {
        // Remove loading state
        btnAccept.classList.remove('loading');
        btnText.textContent = 'Aceptar crédito';

        // Populate feedback screen
        populateFeedbackScreen();

        // Show feedback screen with celebratory animation
        showScreen('feedback');
    }, 1500);
}

function populateFeedbackScreen() {
    // Format and show amount
    const amountFormatted = formatInstallmentAmount(selectedAmount);
    feedbackAmount.textContent = `$ ${amountFormatted.integer}`;

    // Due date (use selected day or default to 7)
    const paymentDay = selectedDay !== null ? selectedDay : 7;
    feedbackDueDate.textContent = paymentDay.toString();
}

function handleClose() {
    console.log('Close clicked');

    // Play haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }

    // Go back to calculator
    showScreen('calculator');
}

function handleGoToMoney() {
    console.log('Go to money clicked');

    // Play haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate([20, 10, 20]);
    }

    // Aquí iría la navegación a "Tu dinero"
    alert('Navegando a "Tu dinero"');
}

function handleGoToHome(e) {
    e.preventDefault();
    console.log('Go to home clicked');

    // Play haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }

    // Go back to calculator
    showScreen('calculator');
}

function handleViewPaymentPlan(e) {
    e.preventDefault();
    console.log('View payment plan clicked');

    // Play haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }

    // Aquí iría la lógica para ver el plan de pagos
    alert('Funcionalidad "Revisar plan de pagos" - Por implementar');
}

function handleReviewScroll() {
    if (!reviewContainer || !reviewAction) return;

    const scrollTop = reviewContainer.scrollTop;
    const scrollHeight = reviewContainer.scrollHeight;
    const clientHeight = reviewContainer.clientHeight;

    // Threshold: 50px from bottom
    const threshold = 50;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

    // Unlock button when user reaches near bottom
    if (isNearBottom && !isButtonUnlocked) {
        isButtonUnlocked = true;
        reviewAction.classList.add('sticky');
        reviewContainer.classList.add('has-sticky-button');
    }

    // Keep button sticky once unlocked
    if (isButtonUnlocked) {
        reviewAction.classList.add('sticky');
        reviewContainer.classList.add('has-sticky-button');
    }
}

// ===== CONTINUE HANDLER =====
function handleContinue() {
    const amount = parseAmount(currentAmount);

    if (amount > 0 && amount <= CONFIG.MAX_AMOUNT) {
        selectedAmount = amount;

        // Update requested amount text
        const amountFormatted = formatInstallmentAmount(amount);
        amountRequested.textContent = `Estás pidiendo: $ ${amountFormatted.integer}`;

        // Render installments list
        renderInstallmentsList();

        // Play haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([20, 10, 20]);
        }

        // Transition to installments screen
        showScreen('installments');
    }
}

// ===== PHYSICAL KEYBOARD SUPPORT =====
document.addEventListener('keydown', (e) => {
    // Only handle keyboard if on calculator screen
    if (currentScreen !== 'calculator') return;

    // Numbers
    if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumber(e.key);
        updateDisplay();
    }

    // Decimal (comma or period)
    if (e.key === ',' || e.key === '.') {
        e.preventDefault();
        handleDecimal();
        updateDisplay();
    }

    // Backspace/Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
        updateDisplay();
    }

    // Enter (continue)
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!btnContinue.disabled) {
            handleContinue();
        }
    }
});

// ===== PAYMENT DAY PICKER =====
const btnModifyPaymentDay = document.getElementById('btnModifyPaymentDay');
const paymentDayBottomsheet = document.getElementById('paymentDayBottomsheet');
const btnDismissBottomsheet = document.getElementById('btnDismissBottomsheet');
const daysPicker = document.getElementById('daysPicker');
const paymentDayValue = document.getElementById('paymentDayValue');
const paymentDayDescription = document.getElementById('paymentDayDescription');

// Month abbreviations for description
const monthAbbr = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

let currentDate = new Date();
let selectedDay = null; // No default selection
let activeDates = []; // No default active dates (can have max 2)

// Calculate interest rate modifier based on payment day
// Incremental: day 1 = lowest, day 28 = highest
function getPaymentDayModifier(day) {
    if (!day) return 0; // No modifier if no day selected

    // Incremental modifier: 0% for day 1, up to +3% for day 28
    // Each day adds approximately 0.11% more interest
    const modifier = ((day - 1) / 27) * 3; // 0% to 3% range

    return modifier;
}

// Show skeleton loaders while calculating
function showInstallmentsSkeleton() {
    installmentsList.innerHTML = '';

    // Create 7 skeleton items (one for each installment option)
    for (let i = 0; i < 7; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'installment-skeleton';
        skeleton.innerHTML = `
            <div class="skeleton-line skeleton-left"></div>
            <div class="skeleton-line skeleton-right"></div>
        `;
        installmentsList.appendChild(skeleton);
    }
}

// Recalculate installments with new interest based on payment day
function recalculateInstallments(day) {
    console.log(`Recalculating installments for payment day: ${day}`);

    // Show skeleton loaders
    showInstallmentsSkeleton();

    // Wait longer to show the loading state (bottomsheet closes at 200ms + 800ms delay)
    setTimeout(() => {
        // Re-render the installments list with new interest rates
        renderInstallmentsList();

        // Show feedback to user
        const modifier = getPaymentDayModifier(day);
        console.log(`Interest modifier for day ${day}: +${modifier.toFixed(2)}%`);
    }, 1000);
}

// Open bottomsheet
btnModifyPaymentDay.addEventListener('click', () => {
    // Check if can add more dates (max 2 active)
    if (activeDates.length >= 2) {
        alert('Ya tienes 2 fechas de pago activas. No puedes agregar más.');
        return;
    }

    // Update description
    const description = document.getElementById('bottomsheetDescription');
    if (description) {
        description.textContent = 'Selecciona un día del 1 al 28';
    }

    console.log('Opening day picker');

    // First display the element
    paymentDayBottomsheet.style.display = 'flex';

    // Force a reflow
    paymentDayBottomsheet.offsetHeight;

    // Then add active class for animation
    requestAnimationFrame(() => {
        paymentDayBottomsheet.classList.add('active');
    });

    renderDaysPicker();

    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
});

// Close bottomsheet
btnDismissBottomsheet.addEventListener('click', () => {
    closeBottomsheet();
});

// Close on overlay click
paymentDayBottomsheet.addEventListener('click', (e) => {
    if (e.target === paymentDayBottomsheet) {
        closeBottomsheet();
    }
});

function closeBottomsheet() {
    paymentDayBottomsheet.classList.remove('active');

    if (navigator.vibrate) {
        navigator.vibrate(10);
    }

    // Wait for animation to finish before hiding
    setTimeout(() => {
        paymentDayBottomsheet.style.display = 'none';
    }, 500);
}

// No month navigation needed for simple day picker

// Render days picker (1-28)
function renderDaysPicker() {
    // Clear picker
    daysPicker.innerHTML = '';

    // Create 28 day buttons
    for (let day = 1; day <= 28; day++) {
        const button = document.createElement('button');
        button.className = 'day-option';
        button.textContent = day;

        // Check if this day is selected
        if (day === selectedDay) {
            button.classList.add('selected');
        }

        // Add click listener
        button.addEventListener('click', () => {
            console.log('Day clicked:', day);
            selectDay(day);
        });

        daysPicker.appendChild(button);
    }
}

// Select a day
function selectDay(day) {
    console.log('Selecting day:', day);
    selectedDay = day;
    paymentDayValue.textContent = `${day} de cada mes`;

    // Calculate first payment date
    const today = new Date();
    const firstPayment = new Date(today);
    firstPayment.setDate(day);

    // If the day already passed this month, move to next month
    if (firstPayment <= today) {
        firstPayment.setMonth(firstPayment.getMonth() + 1);
    }

    // Update description with first payment date
    const monthAbbreviation = monthAbbr[firstPayment.getMonth()];
    if (paymentDayDescription) {
        paymentDayDescription.textContent = `Primera cuota el ${day}/${monthAbbreviation}.`;
    }

    // Recalculate interest based on selected day
    recalculateInstallments(day);

    if (navigator.vibrate) {
        navigator.vibrate(20);
    }

    // Close bottomsheet after selection
    setTimeout(() => {
        closeBottomsheet();
    }, 200);
}

// ===== START APP =====
init();
