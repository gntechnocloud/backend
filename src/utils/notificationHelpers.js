// src/utils/notificationHelpers.js

import nodemailer from 'nodemailer';
import axios from 'axios';
import { info, error as logError } from './logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html
    });
    info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logError('Email sending error:', err);
  }
};

export const sendWebhook = async ({ event, payload }) => {
  try {
    await axios.post(process.env.WEBHOOK_URL, {
      event,
      data: payload
    });
    info(`Webhook event ${event} sent.`);
  } catch (err) {
    logError('Webhook sending error:', err);
  }
};
export const sendNotification = async ({ type, user, message }) => {
  try {
    if (type === 'email') {
      await sendEmail({
        to: user.email,
        subject: 'Notification',
        text: message,
        html: `<p>${message}</p>`
      });
    } else if (type === 'webhook') {
      await sendWebhook({
        event: 'notification',
        payload: { userId: user._id, message }
      });
    } else {
      logError(`Unknown notification type: ${type}`);
    }
  } catch (err) {
    logError('Notification sending error:', err);
  }
};
export const notifyUser = async (user, message) => {
  try {
    if (!user || !user.email) {
      logError('User or user email is missing for notification');
      return;
    }
    await sendNotification({
      type: 'email',
      user,
      message
    });
  } catch (err) {
    logError('Error notifying user:', err);
  }
};
export const notifyAdmin = async (message) => {
  try {
    await sendNotification({
      type: 'email',
      user: { email: process.env.ADMIN_EMAIL },
      message
    });
  } catch (err) {
    logError('Error notifying admin:', err);
  }
};
export const notifyWebhook = async (event, payload) => {
  try {
    await sendWebhook({ event, payload });
  } catch (err) {
    logError('Error sending webhook notification:', err);
  }
};
export const notifyError = async (error) => {
  try {
    await sendNotification({
      type: 'email',
      user: { email: process.env.ADMIN_EMAIL },
      message: `Error occurred: ${error.message}\nStack: ${error.stack}`
    });
  } catch (err) {
    logError('Error notifying about an error:', err);
  }
};
export const notifyTransaction = async (transaction) => {
  try {
    await sendNotification({
      type: 'webhook',
      user: { email: process.env.ADMIN_EMAIL },
      message: `Transaction completed: ${JSON.stringify(transaction)}`
    });
  } catch (err) {
    logError('Error notifying about a transaction:', err);
  }
};
export const notifyIncome = async (income) => {
  try {
    await sendNotification({
      type: 'webhook',
      user: { email: process.env.ADMIN_EMAIL },
      message: `Income received: ${JSON.stringify(income)}`
    });
  } catch (err) {
    logError('Error notifying about income:', err);
  }
};
export const notifyEvent = async (event, payload) => {
  try {
    await sendWebhook({ event, payload });
  } catch (err) {
    logError('Error notifying about an event:', err);
  }
};
export const notifyLevelIncome = async (levelIncome) => {
  try {
    await sendNotification({
      type: 'webhook',
      user: { email: process.env.ADMIN_EMAIL },
      message: `Level income received: ${JSON.stringify(levelIncome)}`
    });
  } catch (err) {
    logError('Error notifying about level income:', err);
  }
};
export const notifyMatrixIncome = async (matrixIncome) => {
  try {
    await sendNotification({
      type: 'webhook',
      user: { email: process.env.ADMIN_EMAIL },
      message: `Matrix income received: ${JSON.stringify(matrixIncome)}`
    });
  } catch (err) {
    logError('Error notifying about matrix income:', err);
  }
};
export const notifyAdminFee = async (adminFee) => {
  try {
    await sendNotification({
      type: 'webhook',
      user: { email: process.env.ADMIN_EMAIL },
      message: `Admin fee paid: ${JSON.stringify(adminFee)}`
    });
  } catch (err) {
    logError('Error notifying about admin fee:', err);
  }
};
export const notifyUserTransaction = async (user, transaction) => {
  try {
    await sendNotification({
      type: 'email',
      user,
      message: `Transaction completed: ${JSON.stringify(transaction)}`
    });
  } catch (err) {
    logError('Error notifying user about transaction:', err);
  }
};
export const notifyUserIncome = async (user, income) => {
  try {
    await sendNotification({
      type: 'email',
      user,
      message: `Income received: ${JSON.stringify(income)}`
    });
  } catch (err) {
    logError('Error notifying user about income:', err);
  }
};
export const notifyUserLevelIncome = async (user, levelIncome) => {
  try {
    await sendNotification({
      type: 'email',
      user,
      message: `Level income received: ${JSON.stringify(levelIncome)}`
    });
  } catch (err) {
    logError('Error notifying user about level income:', err);
  }
};
export const notifyUserMatrixIncome = async (user, matrixIncome) => {
  try {
    await sendNotification({
      type: 'email',
      user,
      message: `Matrix income received: ${JSON.stringify(matrixIncome)}`
    });
  } catch (err) {
    logError('Error notifying user about matrix income:', err);
  }
};
export const notifyUserAdminFee = async (user, adminFee) => {
  try {
    await sendNotification({
      type: 'email',
      user,
      message: `Admin fee paid: ${JSON.stringify(adminFee)}`
    });
  } catch (err) {
    logError('Error notifying user about admin fee:', err);
  }
};
export const notifyUserTransactionError = async (user, error) => {
  try {
    await sendNotification({
      type: 'email',
      user,
      message: `Transaction error: ${error.message}\nStack: ${error.stack}`
    });
  } catch (err) {
    logError('Error notifying user about transaction error:', err);
  }
};