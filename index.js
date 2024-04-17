const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./connect');
const Expense = require('./model');

const app = express();
const router = express.Router();
const month = 'April'
app.use(bodyParser.json());

const getRemainingAmount = async (group) => {
    try {
      const expenses = await Expense.find({ group: group });
      console.log(expenses)
      const totalSpent = expenses.reduce((total, expense) => total + expense.spent.reduce((a, b) => a + b, 0), 0);
      const allowance = expenses.length > 0 ? expenses[0].allowance : 0;
      const remainingAmount = allowance - totalSpent;
      return remainingAmount;
    } catch (error) {
      console.error('Error calculating remaining amount:', error);
      return null;
    }
};
  

// Định nghĩa hàm getMultiplyBase
const getMultiplyBase = (unitLabel) => {
    switch (unitLabel.toLowerCase()) {
      case 'k':
      case 'nghìn':
      case 'ngàn':
        return 1000;
      case 'lít':
      case 'lit':
        return 100000;
      case 'củ':
      case 'triệu':
        return 1000000;
      default:
        return 1;
    }
  };
  
  app.post('/addExpense', async (req, res) => {
    const text = req.body.text;
    try {
      // Sử dụng regex để phân tích text
      const regex = /(\w*)\s(.*)\s(\d*)(\w*)/g;
      const groupText = text.replace(regex, '$1');
      let group;
      switch (groupText.toLowerCase()) {
        case 'an':
          group = 'ăn';
          break;
        case 'shopping':
          group = 'shopping';
          break;
        case 'dichuyen':
          group = 'di chuyển';
          break;
        case 'choi':
          group = 'chơi';
          break;
        default:
          group = 'khác';
      }
      const label = text.replace(regex, '$2');
      const priceText = text.replace(regex, '$3');
      const unitLabel = text.replace(regex, '$4');
      const time = new Date();
      const price = Number(priceText) * getMultiplyBase(unitLabel);
    
      // Tìm hoặc tạo document chi tiêu trong MongoDB
      const existingExpense = await Expense.findOneAndUpdate(
        { group },
        {
          $push: { spent: price, spentTime: time, description: label }
        },
        { upsert: true, new: true }
      );
      
      // Tính toán số tiền còn lại trong mỗi nhóm chi tiêu
      const remainingAmounts = {};
      const groups = ['ăn', 'shopping', 'di chuyển', 'chơi', 'khác'];
      for (const group of groups) {
        remainingAmounts[group] = await getRemainingAmount(group);
      }
      
      res.status(201).json({ 
        remainingAmounts: Object.entries(remainingAmounts).map(([group, amount]) => ({ group, remainingAmount: amount })) 
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  app.post('/init', async (req, res) => {
    try {
      await Expense.create({
        time: month,
        group: 'ăn',
        allowance: 1000000
      });
  
      await Expense.create({
        time: month,
        group: 'shopping',
        allowance: 2000000
      });
  
      await Expense.create({
        time: month,
        group: 'di chuyển',
        allowance: 500000
      });
  
      await Expense.create({
        time: month,
        group: 'chơi',
        allowance: 500000
      });
  
      await Expense.create({
        time: month,
        group: 'khác',
        allowance: 200000
      });
  
      res.status(201).json({ message: 'Initialization completed successfully' });
    } catch (error) {
      console.error('Error initializing expenses:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

// Endpoint để lấy số tiền còn lại trong mỗi nhóm chi tiêu
app.get('/remainingAmount', async (req, res) => {
  const group_name = req.body.group;
  try {
    const remainingAmount = await getRemainingAmount(group_name);
    if (remainingAmount !== null) {
      res.status(200).json({ remainingAmount });
    } else {
      res.status(404).json({ error: 'Group not found or error occurred' });
    }
  } catch (error) {
    console.error('Error getting remaining amount:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(8000, () => {
  console.log('Server is running on port 3000');
});
