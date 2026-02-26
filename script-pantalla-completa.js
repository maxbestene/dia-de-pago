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
const reviewDueDateHelper = document.getElementById('reviewDueDateHelper');
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

// Payment Day screen (will be defined later after DOM loads)
let screenPaymentDay = null;
let btnBackPaymentDay = null;

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

    // Initialize payment day display with default value
    if (paymentDayValue && selectedMonth !== null) {
        const monthName = monthNames[selectedMonth].toLowerCase();
        paymentDayValue.textContent = `${selectedDay} de ${monthName}`;
    }

    // Update display
    updateDisplay();
}

// ===== SCREEN MANAGEMENT =====
const screenOrder = ['calculator', 'installments', 'paymentDay', 'review', 'feedback'];

function showScreen(screenName, direction = 'forward') {
    const screens = {
        calculator: screenCalculator,
        installments: screenInstallments,
        paymentDay: screenPaymentDay,
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

    // Special case: paymentDay slides over installments — installments stays fixed
    if (screenName === 'paymentDay') {
        nextScreenEl.classList.add('active');
        currentScreen = screenName;
        return;
    }
    if (currentScreen === 'paymentDay') {
        currentScreenEl.classList.add('exiting-back');
        setTimeout(() => {
            currentScreenEl.classList.remove('active', 'exiting', 'exiting-back');
        }, 400);
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

// Alias for showScreen
function navigateToScreen(screenName, direction = 'forward') {
    showScreen(screenName, direction);
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

    // Payment day - First payment date and recurring info
    if (selectedDay !== null && selectedMonth !== null) {
        const monthName = monthNames[selectedMonth].toLowerCase();
        reviewDueDate.textContent = `Tu primer pago es el ${selectedDay} de ${monthName}`;
        reviewDueDateHelper.textContent = `Las próximas cuotas vencerán el ${selectedDay} de cada mes. Si cae en día feriado o fin de semana, se moverá al próximo día hábil.`;
    } else {
        // Default values if no date selected
        reviewDueDate.textContent = `Tu primer pago es el 7 de marzo`;
        reviewDueDateHelper.textContent = `Las próximas cuotas vencerán el 7 de cada mes. Si cae en día feriado o fin de semana, se moverá al próximo día hábil.`;
    }
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
screenPaymentDay = document.getElementById('screenPaymentDay');
btnBackPaymentDay = document.getElementById('btnBackPaymentDay');
const calendarMonthLabel = document.getElementById('calendarMonthLabel');
const calendarDays = document.getElementById('calendarDays');
const btnPrevMonth = document.getElementById('btnPrevMonth');
const btnNextMonth = document.getElementById('btnNextMonth');
const paymentDayValue = document.getElementById('paymentDayValue');
const selectedDateCard = document.getElementById('selectedDateCard');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const selectedDateText = document.getElementById('selectedDateText');
const btnConfirmDate = document.getElementById('btnConfirmDate');

let currentDate = new Date();

// Calculate default payment date (day 7, first valid month)
const today = new Date();
const defaultPaymentDay = 7;
const minDate = new Date(today);
minDate.setDate(today.getDate() + 15);

// Find first occurrence of day 7 that's at least 15 days away
let defaultDate = new Date(today);
defaultDate.setDate(defaultPaymentDay);

// If day 7 of current month is too early, move to next month
while (defaultDate <= minDate) {
    defaultDate.setMonth(defaultDate.getMonth() + 1);
    defaultDate.setDate(defaultPaymentDay);
}

let selectedDay = defaultPaymentDay;
let selectedMonth = defaultDate.getMonth();
let selectedYear = defaultDate.getFullYear();
let activeDates = []; // No default active dates (can have max 2)

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Holidays 2026 (Argentina) - Update with actual holidays
const holidays = [
    '2026-01-01', // Año Nuevo
    '2026-02-16', '2026-02-17', // Carnaval
    '2026-03-24', // Día de la Memoria
    '2026-04-02', // Malvinas
    '2026-04-03', // Viernes Santo
    '2026-05-01', // Día del Trabajador
    '2026-05-25', // Revolución de Mayo
    '2026-06-20', // Día de la Bandera
    '2026-07-09', // Independencia
    '2026-08-17', // San Martín
    '2026-10-12', // Día de la Raza
    '2026-11-20', // Soberanía Nacional
    '2026-12-08', // Inmaculada Concepción
    '2026-12-25', // Navidad
];

// Calculate date range (15 to 45 days from today)
function getDateRange() {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 15);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 45);

    return { minDate, maxDate };
}

// Check if date is weekend
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
}

// Check if date is holiday
function isHoliday(date) {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
}

// Check if day is valid (within range, not weekend, not holiday)
function isDayValid(year, month, day) {
    const date = new Date(year, month, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate min and max dates
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 15);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 45);

    const inRange = date >= minDate && date <= maxDate;
    const weekend = isWeekend(date);
    const holiday = isHoliday(date);
    const isValid = inRange && !weekend && !holiday;

    // Only log invalid days to reduce console spam
    if (!isValid) {
        console.log(`Day ${day}/${month+1}/${year}:`, {
            inRange,
            weekend,
            holiday,
            isValid
        });
    }

    return isValid;
}

// Calculate interest rate modifier based on payment day
// Incremental: day 1 = lowest, day 31 = highest
function getPaymentDayModifier(day) {
    if (!day) return 0; // No modifier if no day selected

    // Incremental modifier: 0% for day 1, up to +3% for day 31
    // Each day adds approximately 0.1% more interest
    const modifier = ((day - 1) / 30) * 3; // 0% to 3% range

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

// Open payment day screen
btnModifyPaymentDay.addEventListener('click', () => {
    // Check if can add more dates (max 2 active)
    if (activeDates.length >= 2) {
        alert('Ya tienes 2 fechas de pago activas. No puedes agregar más.');
        return;
    }

    // Description is already set in HTML
    // "Este día se usará para tus próximos créditos."

    // Set calendar to start at minDate month (15 days from today)
    const today = new Date();
    const { minDate } = getDateRange();
    currentDate = new Date(minDate);

    console.log('Opening calendar:', {
        today: today.toISOString().split('T')[0],
        minDate: minDate.toISOString().split('T')[0],
        calendarMonth: `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    });

    // Navigate to payment day screen
    navigateToScreen('paymentDay');

    // Initialize selected date card with current selection
    if (selectedDateLabel && selectedDateText) {
        selectedDateLabel.textContent = `${selectedDay} de ${monthNames[selectedMonth]}`;
        selectedDateText.textContent = `Tu fecha de pago sería el día ${selectedDay} de cada mes.`;
    }

    renderCalendar();

    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
});

// Back from payment day screen
if (btnBackPaymentDay) {
    btnBackPaymentDay.addEventListener('click', () => {
        closePaymentDayScreen();
    });
}

// Confirm date button
if (btnConfirmDate) {
    btnConfirmDate.addEventListener('click', () => {
        closePaymentDayScreen();
    });
}

// Removed overlay click handler (no longer needed for fullscreen version)

function closePaymentDayScreen() {
    navigateToScreen('installments');

    // Esperar a que el calendario termine de bajar (400ms) + skeleton visible (~800ms)
    setTimeout(() => {
        renderInstallmentsList();
    }, 1200);

    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

// Navigate months
btnPrevMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();

    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
});

btnNextMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();

    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
});

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month label
    calendarMonthLabel.textContent = `${monthNames[month]} de ${year}`;

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    // Adjust so Monday = 0
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;

    // Get number of days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get days from previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Clear calendar
    calendarDays.innerHTML = '';

    // Add days from previous month
    for (let i = firstDayAdjusted - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const button = document.createElement('button');
        button.className = 'calendar-day other-month';
        button.textContent = day;
        button.disabled = true;
        calendarDays.appendChild(button);
    }

    // Get today's date for comparison
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
        const button = document.createElement('button');
        button.className = 'calendar-day';
        button.textContent = day;

        // Check if this is today
        if (year === todayYear && month === todayMonth && day === todayDay) {
            button.classList.add('today');
        }

        // Check if day is valid
        const isValid = isDayValid(year, month, day);

        if (!isValid) {
            button.disabled = true;
            button.classList.add('disabled');
        } else {
            // Add click listener only to valid days
            button.addEventListener('click', () => {
                console.log('Day clicked:', day);
                selectDay(day, month, year);
            });
        }

        if (selectedDay !== null && day === selectedDay && year === currentDate.getFullYear() && month === currentDate.getMonth()) {
            button.classList.add('selected');
        }

        calendarDays.appendChild(button);
    }

    // Add days from next month to complete the grid
    const totalCells = calendarDays.children.length;
    const cellsNeeded = Math.ceil(totalCells / 7) * 7;
    const daysToAdd = cellsNeeded - totalCells;

    for (let day = 1; day <= daysToAdd; day++) {
        const button = document.createElement('button');
        button.className = 'calendar-day other-month';
        button.textContent = day;
        button.disabled = true;
        calendarDays.appendChild(button);
    }
}

// Select a day
// Month abbreviations for the selected date card
const monthAbbr = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function selectDay(day, month, year) {
    console.log('Selecting day:', day, monthNames[month], year);
    selectedDay = day;
    selectedMonth = month;
    selectedYear = year;

    // Format first payment date: "19 de marzo"
    const monthName = monthNames[month].toLowerCase();
    paymentDayValue.textContent = `${day} de ${monthName}`;

    // Update selected date card
    if (selectedDateLabel && selectedDateText) {
        selectedDateLabel.textContent = `${day} de ${monthNames[month]}`;
        selectedDateText.textContent = `Tu fecha de pago sería el día ${day} de cada mes.`;
    }

    // Mostrar skeleton ya — el render real ocurre al cerrar el calendario
    showInstallmentsSkeleton();

    // Update calendar to show selection
    renderCalendar();

    if (navigator.vibrate) {
        navigator.vibrate(20);
    }
}

// ===== START APP =====
init();
