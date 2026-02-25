// ===== CONFIGURATION =====
const CONFIG = {
    MIN_AMOUNT: 10,
    MAX_AMOUNT: 10000,
    MAX_INPUT_AMOUNT: 100000000,
    MAX_DECIMALS: 2,
    INSTALLMENTS_OPTIONS: [1, 3, 6, 9, 12, 18, 24],
    INTEREST_RATES: {
        1: 0,
        3: 15,
        6: 25,
        9: 35,
        12: 45,
        18: 55,
        24: 65
    }
};

// ===== STATE =====
let currentAmount = '';
let selectedAmount = 0;
let selectedInstallments = 0;
let selectedCalculation = null;
let currentScreen = 'calculator';
let selectedDay = null;

// ===== DOM ELEMENTS =====
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

const screenInstallments = document.getElementById('screenInstallments');
const btnBackInstallments = document.getElementById('btnBackInstallments');
const amountRequested = document.getElementById('amountRequested');
const installmentsList = document.getElementById('installmentsList');
const paymentDayValue = document.getElementById('paymentDayValue');
const paymentDayDescription = document.getElementById('paymentDayDescription');
const btnModifyPaymentDay = document.getElementById('btnModifyPaymentDay');

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

const screenFeedback = document.getElementById('screenFeedback');
const btnClose = document.getElementById('btnClose');
const feedbackAmount = document.getElementById('feedbackAmount');
const feedbackDueDate = document.getElementById('feedbackDueDate');
const btnGoToMoney = document.getElementById('btnGoToMoney');
const btnGoToHome = document.getElementById('btnGoToHome');

const screenPaymentDay = document.getElementById('screenPaymentDay');
const btnBackPaymentDay = document.getElementById('btnBackPaymentDay');
const btnConfirmDate = document.getElementById('btnConfirmDate');
const daysPicker = document.getElementById('daysPicker');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const selectedDateText = document.getElementById('selectedDateText');

let isButtonUnlocked = false;

// Month abbreviations
const monthAbbr = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// ===== INITIALIZATION =====
function init() {
    helperValue.textContent = `$ ${formatCurrency(CONFIG.MAX_AMOUNT)}`;
    btnPreset.querySelector('.preset-text').textContent = `$ ${formatCurrency(CONFIG.MAX_AMOUNT)}`;

    keys.forEach(key => key.addEventListener('click', handleKeyPress));
    btnPreset.addEventListener('click', handlePresetClick);
    btnContinue.addEventListener('click', handleContinue);
    btnBackInstallments.addEventListener('click', handleBackToCalculator);
    btnBackReview.addEventListener('click', handleBackToInstallments);
    btnAccept.addEventListener('click', handleAccept);
    btnViewPaymentPlan.addEventListener('click', handleViewPaymentPlan);
    btnModifyPaymentDay.addEventListener('click', openPaymentDayScreen);
    btnBackPaymentDay.addEventListener('click', closePaymentDayScreen);
    btnConfirmDate.addEventListener('click', closePaymentDayScreen);

    if (reviewContainer) {
        reviewContainer.addEventListener('scroll', handleReviewScroll);
    }

    btnClose.addEventListener('click', handleClose);
    btnGoToMoney.addEventListener('click', handleGoToMoney);
    btnGoToHome.addEventListener('click', handleGoToHome);

    // Set default day (7)
    selectedDay = 7;
    updatePaymentDayCard(7);

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

    const currentIndex = screenOrder.indexOf(currentScreen);
    const nextIndex = screenOrder.indexOf(screenName);
    const isForward = direction === 'forward' || nextIndex > currentIndex;

    if (screenName === 'feedback' && isForward) {
        nextScreenEl.classList.add('celebrating', 'active');
        if (currentScreenEl) {
            currentScreenEl.style.transition = 'opacity 0.3s ease-out';
            currentScreenEl.style.opacity = '0';
        }
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

    if (!isForward) {
        nextScreenEl.classList.add('from-left');
        nextScreenEl.offsetHeight;
        nextScreenEl.classList.remove('from-left');
        nextScreenEl.classList.add('active');
    } else {
        nextScreenEl.classList.add('active');
    }

    if (currentScreenEl) {
        currentScreenEl.classList.add(isForward ? 'exiting' : 'exiting-back');
    }

    setTimeout(() => {
        if (currentScreenEl) {
            currentScreenEl.classList.remove('active', 'exiting', 'exiting-back', 'celebrating');
        }
    }, 400);

    currentScreen = screenName;
}

function handleBackToCalculator() { showScreen('calculator', 'backward'); }
function handleBackToInstallments() { showScreen('installments', 'backward'); }

// ===== PAYMENT DAY SCREEN =====
function openPaymentDayScreen() {
    const aiSkeleton = document.getElementById('aiSkeleton');
    const aiText = document.getElementById('aiSuggestionText');

    // Resetear animación AI
    if (aiSkeleton) aiSkeleton.classList.remove('hidden');
    if (aiText) aiText.classList.remove('visible');

    renderDaysPicker();
    showScreen('paymentDay');

    // 1500ms: ocultar skeleton
    setTimeout(() => {
        if (aiSkeleton) aiSkeleton.classList.add('hidden');
    }, 1500);

    // 1750ms: mostrar texto AI
    setTimeout(() => {
        if (aiText) aiText.classList.add('visible');
    }, 1750);

    // 1950ms+: stagger border reveal en días sugeridos (1–9)
    const suggestedDays = daysPicker.querySelectorAll('.day-suggested');
    suggestedDays.forEach((el, i) => {
        setTimeout(() => {
            el.classList.add('border-visible');
        }, 1950 + i * 60);
    });

    if (navigator.vibrate) navigator.vibrate(10);
}

function closePaymentDayScreen() {
    showScreen('installments', 'backward');

    // Skeleton visible tras el cierre (~400ms animación + ~800ms visible)
    setTimeout(() => {
        renderInstallmentsList();
    }, 1200);

    if (navigator.vibrate) navigator.vibrate(10);
}

// ===== DAY PICKER =====
function renderDaysPicker() {
    daysPicker.innerHTML = '';

    for (let day = 1; day <= 28; day++) {
        const button = document.createElement('button');
        button.className = 'day-option';
        button.textContent = day;
        if (day === selectedDay) button.classList.add('selected');
        if (day <= 9) button.classList.add('day-suggested');
        button.addEventListener('click', () => selectDay(day));
        daysPicker.appendChild(button);
    }
}

function selectDay(day) {
    selectedDay = day;

    // Actualizar selected-date-card
    selectedDateLabel.textContent = `Día ${day}`;
    selectedDateText.textContent = `Tu fecha de pago será el ${day} de cada mes.`;

    // Mostrar skeleton en la lista de cuotas (el render ocurre al cerrar)
    showInstallmentsSkeleton();

    // Actualizar selección visual en el picker
    renderDaysPicker();

    if (navigator.vibrate) navigator.vibrate(20);
}

function updatePaymentDayCard(day) {
    if (paymentDayValue) paymentDayValue.textContent = `${day} de cada mes`;

    if (paymentDayDescription) {
        const today = new Date();
        const firstPayment = new Date(today);
        firstPayment.setDate(day);
        if (firstPayment <= today) firstPayment.setMonth(firstPayment.getMonth() + 1);
        paymentDayDescription.textContent = `Primera cuota el ${day}/${monthAbbr[firstPayment.getMonth()]}.`;
    }
}

// ===== KEYBOARD HANDLERS =====
function handleKeyPress(e) {
    const key = e.currentTarget.dataset.key;
    if (navigator.vibrate) navigator.vibrate(10);
    if (key === 'delete') {
        handleDelete();
    } else {
        handleNumber(key);
    }
    updateDisplay();
}

function handleNumber(num) {
    if (currentAmount === '0') { currentAmount = num; return; }
    const newAmount = currentAmount + num;
    if (parseAmount(newAmount) > CONFIG.MAX_INPUT_AMOUNT) return;
    currentAmount = newAmount;
}

function handleDelete() {
    if (currentAmount === '') return;
    currentAmount = currentAmount.slice(0, -1);
    if (currentAmount === '') currentAmount = '0';
}

function handlePresetClick() {
    currentAmount = CONFIG.MAX_AMOUNT.toString();
    btnPreset.classList.add('selected');
    updateDisplay();
    if (navigator.vibrate) navigator.vibrate(20);
}

// ===== DISPLAY UPDATES =====
function updateDisplay() {
    const amount = parseAmount(currentAmount);
    const displayValue = formatDisplayAmount(currentAmount);
    amountValueEl.textContent = displayValue;
    adjustFontSize(displayValue);

    let hasError = false;
    let errorMsg = '';
    if (amount > 0 && amount < CONFIG.MIN_AMOUNT) {
        hasError = true;
        errorMsg = `Ingresa un monto mayor a $ ${formatCurrency(CONFIG.MIN_AMOUNT)}`;
    } else if (amount > CONFIG.MAX_AMOUNT) {
        hasError = true;
        errorMsg = `Ingresa un monto menor a $ ${formatCurrency(CONFIG.MAX_AMOUNT)}`;
    }

    if (hasError) {
        errorMessage.style.display = 'flex';
        errorText.textContent = errorMsg;
    } else {
        errorMessage.style.display = 'none';
    }

    const isValid = amount >= CONFIG.MIN_AMOUNT && amount <= CONFIG.MAX_AMOUNT;
    btnContinue.disabled = !isValid;

    if (amount >= CONFIG.MIN_AMOUNT && isValid) {
        installmentInfo.style.display = 'flex';
        document.querySelector('.installment-text').textContent = `Pagarás en 24 cuotas.`;
    } else {
        installmentInfo.style.display = 'none';
    }

    if (amount === CONFIG.MAX_AMOUNT) {
        btnPreset.classList.add('selected');
    } else {
        btnPreset.classList.remove('selected');
    }

    updateCursor();
}

function adjustFontSize(displayValue) {
    const totalLength = displayValue.length;
    let fontSize = 56;
    if (totalLength >= 13) fontSize = 20;
    else if (totalLength >= 11) fontSize = 24;
    else if (totalLength >= 9) fontSize = 32;
    else if (totalLength >= 7) fontSize = 40;
    else if (totalLength >= 5) fontSize = 48;

    amountDisplay.style.fontSize = `${fontSize}px`;
    const currencySymbol = document.querySelector('.currency-symbol');
    currencySymbol.style.fontSize = `${fontSize}px`;

    const amount = parseAmount(currentAmount);
    const color = (amount === 0) ? '#646587' : 'var(--color-text-primary)';
    currencySymbol.style.color = color;
    amountValueEl.style.color = color;

    setTimeout(() => {
        const containerWidth = amountDisplay.parentElement.offsetWidth;
        const displayWidth = amountDisplay.scrollWidth;
        if (displayWidth > containerWidth - 32) {
            const scale = (containerWidth - 32) / displayWidth;
            amountDisplay.style.transform = `scale(${Math.min(scale, 1)})`;
            amountDisplay.style.transformOrigin = 'left center';
        } else {
            amountDisplay.style.transform = 'scale(1)';
        }
    }, 0);
}

function formatDisplayAmount(amount) {
    if (!amount || amount === '0') return '0';
    return amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatCurrency(amount) {
    return amount.toLocaleString('es-AR').replace(/,/g, '.');
}

function formatMoney(amount) {
    return amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseAmount(amount) {
    if (!amount) return 0;
    return parseInt(amount.replace(/\./g, '')) || 0;
}

function updateCursor() {
    const cursor = document.querySelector('.cursor');
    const amount = parseAmount(currentAmount);
    cursor.style.display = (amount === 0 || currentAmount === '' || currentAmount === '0') ? 'inline' : 'none';
}

// ===== INSTALLMENTS =====
function getPaymentDayModifier(day) {
    if (!day) return 0;
    return ((day - 1) / 27) * 3;
}

function calculateInstallment(principal, installments) {
    let annualRate = CONFIG.INTEREST_RATES[installments];
    if (selectedDay !== null) {
        annualRate += getPaymentDayModifier(selectedDay);
    }
    annualRate = annualRate / 100;

    if (installments === 1) {
        return { installmentAmount: principal, totalAmount: principal, interestRate: 0 };
    }

    const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
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
    const parts = amount.toFixed(2).split('.');
    const formattedInteger = parseInt(parts[0]).toLocaleString('es-AR').replace(/,/g, '.');
    return { integer: formattedInteger, decimal: parts[1] };
}

function showInstallmentsSkeleton() {
    installmentsList.innerHTML = '';
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
                <div class="installment-total">$ ${totalFormatted.integer}<sup class="installment-sup">${totalFormatted.decimal}</sup></div>
                <svg class="installment-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;
        option.addEventListener('click', () => handleInstallmentSelect(installments, calculation));
        installmentsList.appendChild(option);
    });

    // Actualizar también la tarjeta de día de pago
    if (selectedDay) updatePaymentDayCard(selectedDay);
}

function handleInstallmentSelect(installments, calculation) {
    selectedInstallments = installments;
    selectedCalculation = calculation;
    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);

    isButtonUnlocked = false;
    if (reviewAction) reviewAction.classList.remove('sticky');
    if (reviewContainer) reviewContainer.classList.remove('has-sticky-button');

    populateReviewScreen();
    showScreen('review');
    if (reviewContainer) reviewContainer.scrollTop = 0;
}

function populateReviewScreen() {
    const amountFormatted = formatInstallmentAmount(selectedAmount);
    reviewAmountReceived.textContent = `$ ${amountFormatted.integer}`;

    const interestAmount = selectedCalculation.totalAmount - selectedAmount;
    const interestFormatted = formatInstallmentAmount(interestAmount);
    reviewInterest.textContent = `$ ${interestFormatted.integer},${interestFormatted.decimal}`;

    const ivaAmount = interestAmount * 0.21;
    const ivaFormatted = formatInstallmentAmount(ivaAmount);
    reviewIVA.textContent = `$ ${ivaFormatted.integer},${ivaFormatted.decimal}`;

    const totalReturn = selectedCalculation.totalAmount + ivaAmount;
    const totalReturnFormatted = formatInstallmentAmount(totalReturn);
    reviewTotalReturn.textContent = `$ ${totalReturnFormatted.integer},${totalReturnFormatted.decimal}`;

    const installmentFormatted = formatInstallmentAmount(selectedCalculation.installmentAmount);
    reviewPaymentPlan.textContent = `${selectedInstallments}x $ ${installmentFormatted.integer},${installmentFormatted.decimal}`;

    let annualRate = CONFIG.INTEREST_RATES[selectedInstallments];
    if (selectedDay !== null) annualRate += getPaymentDayModifier(selectedDay);
    reviewTNA.textContent = `${annualRate.toFixed(2).replace('.', ',')}%`;
    reviewTEA.textContent = `${annualRate.toFixed(2).replace('.', ',')}%`;
    reviewCFTEA.textContent = `${annualRate.toFixed(2).replace('.', ',')}%`;

    const paymentDay = selectedDay !== null ? selectedDay : 7;
    reviewDueDate.textContent = `Tu fecha de pago es el ${paymentDay} de cada mes`;
}

function handleAccept() {
    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
    const btnText = btnAccept.querySelector('.btn-text');
    btnAccept.classList.add('loading');
    btnText.textContent = 'Procesando tu solicitud';

    setTimeout(() => {
        btnAccept.classList.remove('loading');
        btnText.textContent = 'Aceptar crédito';
        populateFeedbackScreen();
        showScreen('feedback');
    }, 1500);
}

function populateFeedbackScreen() {
    const amountFormatted = formatInstallmentAmount(selectedAmount);
    feedbackAmount.textContent = `$ ${amountFormatted.integer}`;
    feedbackDueDate.textContent = (selectedDay !== null ? selectedDay : 7).toString();
}

function handleClose() {
    if (navigator.vibrate) navigator.vibrate(10);
    showScreen('calculator');
}

function handleGoToMoney() {
    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
    alert('Navegando a "Tu dinero"');
}

function handleGoToHome(e) {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(10);
    showScreen('calculator');
}

function handleViewPaymentPlan(e) {
    e.preventDefault();
    alert('Funcionalidad "Revisar plan de pagos" - Por implementar');
}

function handleReviewScroll() {
    if (!reviewContainer || !reviewAction) return;
    const isNearBottom = reviewContainer.scrollTop + reviewContainer.clientHeight >= reviewContainer.scrollHeight - 50;
    if (isNearBottom && !isButtonUnlocked) {
        isButtonUnlocked = true;
        reviewAction.classList.add('sticky');
        reviewContainer.classList.add('has-sticky-button');
    }
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
        const amountFormatted = formatInstallmentAmount(amount);
        amountRequested.textContent = `Estás pidiendo: $ ${amountFormatted.integer}`;
        renderInstallmentsList();
        if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
        showScreen('installments');
    }
}

// ===== PHYSICAL KEYBOARD SUPPORT =====
document.addEventListener('keydown', (e) => {
    if (currentScreen !== 'calculator') return;
    if (e.key >= '0' && e.key <= '9') { e.preventDefault(); handleNumber(e.key); updateDisplay(); }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); handleDelete(); updateDisplay(); }
    if (e.key === 'Enter' && !btnContinue.disabled) { e.preventDefault(); handleContinue(); }
});

// ===== START APP =====
init();
