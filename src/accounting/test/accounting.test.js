'use strict';

const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const test = require('node:test');

const accounting = require('../index');

test.beforeEach(() => {
  accounting.resetBalance();
});

test('TC-001: starts with a 1000.00 balance', () => {
  assert.equal(accounting.getBalanceMessage(), 'Current balance: 1000.00');
});

test('TC-002: displays all four menu choices and repeats after an operation', async () => {
  const output = [];
  const input = Readable.from(['1\n', '4\n']);

  await accounting.run(input, (message) => output.push(message));

  assert.equal(output.filter((message) => message === 'Account Management System').length, 2);
  assert.deepEqual(output.slice(2, 6), [
    '1. View Balance',
    '2. Credit Account',
    '3. Debit Account',
    '4. Exit',
  ]);
});

test('TC-003: views the current balance without changing it', () => {
  assert.equal(accounting.getBalanceMessage(), 'Current balance: 1000.00');
  assert.equal(accounting.readBalance(), 100000);
});

test('TC-004: credits a positive decimal amount', () => {
  assert.equal(accounting.creditAccount('250.50'), 'Amount credited. New balance: 1250.50');
  assert.equal(accounting.getBalanceMessage(), 'Current balance: 1250.50');
});

test('TC-005: credits a whole-number amount with two-decimal display', () => {
  assert.equal(accounting.creditAccount('100'), 'Amount credited. New balance: 1100.00');
});

test('TC-006: rejects a zero credit without changing the balance', () => {
  assert.equal(accounting.creditAccount('0'), 'Invalid amount, please enter a positive amount.');
  assert.equal(accounting.readBalance(), 100000);
});

test('TC-007: debits an amount below the current balance', () => {
  assert.equal(accounting.debitAccount('300.25'), 'Amount debited. New balance: 699.75');
  assert.equal(accounting.getBalanceMessage(), 'Current balance: 699.75');
});

test('TC-008: allows a debit equal to the entire balance', () => {
  assert.equal(accounting.debitAccount('1000.00'), 'Amount debited. New balance: 0.00');
});

test('TC-009: rejects a debit greater than the balance', () => {
  assert.equal(accounting.debitAccount('1000.01'), 'Insufficient funds for this debit.');
  assert.equal(accounting.getBalanceMessage(), 'Current balance: 1000.00');
});

test('TC-010: preserves the balance after an insufficient debit', () => {
  assert.equal(accounting.debitAccount('1500.00'), 'Insufficient funds for this debit.');
  assert.equal(accounting.debitAccount('400.00'), 'Amount debited. New balance: 600.00');
});

test('TC-011: persists the balance across a credit and debit', () => {
  accounting.creditAccount('200.00');
  accounting.debitAccount('50.00');

  assert.equal(accounting.getBalanceMessage(), 'Current balance: 1150.00');
});

test('TC-012: reports invalid menu choices and continues to the next choice', async () => {
  const output = [];
  const input = Readable.from(['0\n', '5\n', '4\n']);

  await accounting.run(input, (message) => output.push(message));

  assert.equal(output.filter((message) => message === 'Invalid choice, please select 1-4.').length, 2);
});

test('TC-013: exits with the goodbye message', async () => {
  const output = [];

  await accounting.run(Readable.from(['4\n']), (message) => output.push(message));

  assert.equal(output.at(-1), 'Exiting the program. Goodbye!');
});

test('TC-014: exits after retaining an account change during the run', async () => {
  const output = [];
  const input = Readable.from(['2\n', '125.00\n', '4\n']);

  await accounting.run(input, (message) => output.push(message));

  assert.ok(output.includes('Amount credited. New balance: 1125.00'));
  assert.equal(output.at(-1), 'Exiting the program. Goodbye!');
});

test('TC-015: reads the stored balance through the data operation', () => {
  assert.equal(accounting.dataProgram('READ'), 100000);
});

test('TC-016: writes and then reads a new balance through the data operation', () => {
  accounting.dataProgram('WRITE', 87525);

  assert.equal(accounting.dataProgram('READ'), 87525);
  assert.equal(accounting.getBalanceMessage(), 'Current balance: 875.25');
});

test('TC-017: ignores an unsupported data operation without changing stored data', () => {
  assert.equal(accounting.dataProgram('DELETE', 1), 1);
  assert.equal(accounting.dataProgram('READ'), 100000);
});

test('TC-018: handles the COBOL six-digit, two-decimal amount limit', () => {
  assert.equal(accounting.parseAmount('999999.99'), 99999999);
  assert.equal(accounting.parseAmount('1000000.00'), 100000000);
  assert.equal(accounting.creditAccount('999999.99'), 'Amount credited. New balance: 1000999.99');
});

test('TC-019: rejects negative, malformed, and blank amounts without changing balance', () => {
  for (const input of ['-10.00', 'not-a-number', '']) {
    assert.equal(accounting.creditAccount(input), 'Invalid amount, please enter a positive amount.');
  }

  assert.equal(accounting.getBalanceMessage(), 'Current balance: 1000.00');
});
