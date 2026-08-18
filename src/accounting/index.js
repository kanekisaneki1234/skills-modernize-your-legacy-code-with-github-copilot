'use strict';

const readline = require('node:readline');

const INITIAL_BALANCE_CENTS = 100000;

let storageBalanceCents = INITIAL_BALANCE_CENTS;

function formatBalance(balanceCents) {
  return (balanceCents / 100).toFixed(2);
}

function parseAmount(input) {
  const normalizedInput = String(input).trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedInput)) {
    return null;
  }

  const [wholePart, fractionalPart = ''] = normalizedInput.split('.');
  const amountCents = Number(wholePart) * 100 + Number(fractionalPart.padEnd(2, '0'));

  return Number.isSafeInteger(amountCents) ? amountCents : null;
}

// DataProgram equivalent: the balance has one read/write owner.
function readBalance() {
  return storageBalanceCents;
}

function writeBalance(balanceCents) {
  if (!Number.isSafeInteger(balanceCents) || balanceCents < 0) {
    throw new RangeError('Balance must be a non-negative amount in cents.');
  }

  storageBalanceCents = balanceCents;
}

function resetBalance() {
  storageBalanceCents = INITIAL_BALANCE_CENTS;
}

function dataProgram(operation, balance) {
  if (operation === 'READ') {
    return readBalance();
  }

  if (operation === 'WRITE') {
    writeBalance(balance);
  }

  return balance;
}

function getBalanceMessage() {
  return `Current balance: ${formatBalance(readBalance())}`;
}

function creditAccount(input) {
  const amountCents = parseAmount(input);

  if (amountCents === null || amountCents <= 0) {
    return 'Invalid amount, please enter a positive amount.';
  }

  const newBalanceCents = readBalance() + amountCents;
  writeBalance(newBalanceCents);
  return `Amount credited. New balance: ${formatBalance(newBalanceCents)}`;
}

function debitAccount(input) {
  const amountCents = parseAmount(input);

  if (amountCents === null || amountCents <= 0) {
    return 'Invalid amount, please enter a positive amount.';
  }

  const currentBalanceCents = readBalance();

  if (currentBalanceCents < amountCents) {
    return 'Insufficient funds for this debit.';
  }

  const newBalanceCents = currentBalanceCents - amountCents;
  writeBalance(newBalanceCents);
  return `Amount debited. New balance: ${formatBalance(newBalanceCents)}`;
}

function showMenu(output) {
  output('--------------------------------');
  output('Account Management System');
  output('1. View Balance');
  output('2. Credit Account');
  output('3. Debit Account');
  output('4. Exit');
  output('--------------------------------');
}

async function run(input = process.stdin, output = console.log) {
  const terminal = readline.createInterface({ input, output: process.stdout });
  const lines = terminal[Symbol.asyncIterator]();

  const ask = async (question) => {
    output(question);
    const nextLine = await lines.next();
    return nextLine.done ? '' : nextLine.value;
  };
  let continueRunning = true;

  try {
    while (continueRunning) {
      showMenu(output);
      const choice = await ask('Enter your choice (1-4): ');

      switch (choice.trim()) {
        case '1':
          output(getBalanceMessage());
          break;
        case '2':
          output('Enter credit amount: ');
          output(creditAccount(await ask('')));
          break;
        case '3':
          output('Enter debit amount: ');
          output(debitAccount(await ask('')));
          break;
        case '4':
          continueRunning = false;
          break;
        default:
          output('Invalid choice, please select 1-4.');
      }
    }
  } finally {
    terminal.close();
  }

  output('Exiting the program. Goodbye!');
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  creditAccount,
  dataProgram,
  debitAccount,
  formatBalance,
  getBalanceMessage,
  parseAmount,
  readBalance,
  resetBalance,
  run,
  writeBalance,
};