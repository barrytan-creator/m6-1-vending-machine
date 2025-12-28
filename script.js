// ------------------------------
// 1) SETUP: Get all the parts we need from the page
// ------------------------------

// This is where we show the money the user has added (CREDIT)
const amountDisplay = document.querySelector('#amount');

// This is where we show the selected item name (or "SELECT AN ITEM")
const selectedItemDisplay = document.querySelector('#selected-item');

// All the product boxes (A1, A2, ..., C3)
const itemCards = document.querySelectorAll('.item');

// Coin buttons (10 cents, 20 cents, and 1 dollar)
const coin10Btn = document.querySelector('#cent10');
const coin20Btn = document.querySelector('#cent20');
const dollarBtn = document.querySelector('#dollar');

// The cancel button
const cancelBtn = document.querySelector('#cancel');

// (Optional) The tray where products come out, in case we want to animate later
const outTray = document.querySelector('#out-tray');

// ------------------------------
// 2) STATE: Remember the important things
// ------------------------------

// We store money in CENTS to avoid weird decimal problems:
// $1.50 is 150 cents, $1.00 is 100 cents, etc.
let creditCents = 0;

// The item the user picked (we store name, priceCents, stock, and a reference to the card)
let selectedItem = null;

// This flag helps us block clicks while "Dispensing Product" is showing
let isDispensing = false;


// ------------------------------
// 3) HELPER FUNCTIONS: Little tools to make life easier
// ------------------------------

// Turn cents (like 150) into a nice string like "$1.50"
function formatMoney(cents) {
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}`;
}

// Read the price text like "$1.50" and turn it into 150 cents
function parsePriceToCents(priceText) {
  // Remove the $ sign, turn into a number, multiply by 100, and round
  const number = parseFloat(priceText.replace('$', ''));
  return Math.round(number * 100);
}

// Read the stock text like "Stock: 5" and get the number 5
function parseStock(stockText) {
  return parseInt(stockText.replace('Stock:', '').trim(), 10);
}

// Update the big display at the top:
// - Shows CREDIT (money added)
// - Shows selected item name OR "SELECT AN ITEM"
// - If an item is selected, also show how much more money we need (negative means "you still need this much")
function refreshDisplay() {
  amountDisplay.textContent = formatMoney(creditCents);

  if (!selectedItem) {
    selectedItemDisplay.textContent = 'SELECT AN ITEM';
    return;
  }

  // Show the item name
  const name = selectedItem.name;

  // Calculate how much more we need to afford it
  const remaining = selectedItem.priceCents - creditCents;

  if (remaining > 0) {
    // Not enough money yet: show negative (means you still need this much)
    selectedItemDisplay.textContent = `${name} | CREDIT: -${formatMoney(remaining)}`;
  } else {
    // Enough money or more: show zero or positive balance
    selectedItemDisplay.textContent = `${name} | CREDIT: ${formatMoney(-remaining)}`;
  }
}

// When the user clicks an item, we set selectedItem with live data from the card
function selectItem(cardEl) {
  // Do nothing if we are currently dispensing
  if (isDispensing) return;

  const name = cardEl.querySelector('.item-name').textContent.trim();
  const priceText = cardEl.querySelector('.item-price').textContent.trim();
  const stockText = cardEl.querySelector('.item-stock').textContent.trim();

  const priceCents = parsePriceToCents(priceText);
  const stock = parseStock(stockText);

  // Save the selection
  selectedItem = {
    name,
    priceCents,
    stock,
    cardEl
  };

  // If stock is 0, we shouldn't allow dispensing
  if (stock <= 0) {
    selectedItemDisplay.textContent = `${name} (Out of stock)`;
    return;
  }

  // Update display with selection and remaining
  refreshDisplay();

  // If we already have enough credit, dispense right away
  tryDispense();
}

// Add coins to the credit
function addCoin(cents) {
  // Do nothing if we are currently dispensing
  if (isDispensing) return;

  creditCents += cents;
  refreshDisplay();

  // If we have enough credit and an item selected, try to dispense
  tryDispense();
}

// Reset everything when Cancel is pressed
function cancelAll() {
  // Do nothing if we are currently dispensing
  if (isDispensing) return;

  creditCents = 0;
  selectedItem = null;

  // Reset the display to the default message
  amountDisplay.textContent = '$0.00';
  selectedItemDisplay.textContent = 'SELECT AN ITEM';
}

// Try to dispense the product if:
// - There is a selected item
// - There is stock
// - The credit is enough (creditCents >= priceCents)
function tryDispense() {
  if (!selectedItem) return;
  if (selectedItem.stock <= 0) return;

  if (creditCents >= selectedItem.priceCents) {
    // We can dispense!
    dispenseProduct();
  }
}

// Show "Dispensing Product", reduce stock by 1, then restore the display after 3 seconds
function dispenseProduct() {
  isDispensing = true;

  // Reduce stock by 1 in the DOM and in our stored state
  selectedItem.stock -= 1;
  const stockEl = selectedItem.cardEl.querySelector('.item-stock');
  stockEl.textContent = `Stock: ${selectedItem.stock}`;

  // Show the dispensing message by temporarily replacing the item display
  const previousText = selectedItemDisplay.textContent;
  selectedItemDisplay.textContent = 'Dispensing Product';

  // Optional: simple fade-out effect by changing opacity
  selectedItemDisplay.style.transition = 'opacity 3s';
  selectedItemDisplay.style.opacity = '0.2';

  // After 3 seconds, restore display and reset selection
  setTimeout(() => {
    // Take the item price from the user's credit (they "paid" for it)
    creditCents -= selectedItem.priceCents;
    if (creditCents < 0) creditCents = 0; // safety check

    // Clear selection if stock is now 0, else keep it selected to show remaining balance
    if (selectedItem.stock <= 0) {
      selectedItem = null;
    }

    // Restore the display visual
    selectedItemDisplay.style.opacity = '1';
    selectedItemDisplay.style.transition = '';

    // Update the display text properly
    refreshDisplay();

    // Done dispensing, allow clicks again
    isDispensing = false;
  }, 3000);
}


// ------------------------------
// 4) WIRE UP EVENTS: Make buttons and items clickable
// ------------------------------

// When we click a coin, we add its value in cents
coin10Btn.addEventListener('click', () => addCoin(10));
coin20Btn.addEventListener('click', () => addCoin(20));
dollarBtn.addEventListener('click', () => addCoin(100));

// Clicking Cancel returns all money and clears the selection
cancelBtn.addEventListener('click', cancelAll);

// Clicking an item selects it
itemCards.forEach((card) => {
  card.addEventListener('click', () => selectItem(card));
});


// ------------------------------
// 5) INITIAL DISPLAY: Show the default starting text
// ------------------------------
refreshDisplay();