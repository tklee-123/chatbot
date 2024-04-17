const mongoose = require('./connect');
const Schema = mongoose.Schema;

const expenseSchema = new Schema({
  time: { type: String }, 
  group: String, 
  allowance: Number, 
  spent: [Number], 
  spentTime: [Date], 
  description: [String] 
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
