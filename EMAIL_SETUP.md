# Email Setup Guide

## 🚨 **Gmail App Password Issues**

If you're having trouble with Gmail app passwords (which is common), here are two reliable alternatives:

## 🔧 **Option 1: SendGrid (Recommended - Free)**

SendGrid is more reliable than Gmail and has a generous free tier.

### **Setup Steps:**
1. **Sign up**: Go to https://sendgrid.com/
2. **Get API Key**: 
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the API key
3. **Update .env file**:
   ```env
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   EMAIL_FROM=kilo.pixel@gmail.com
   ```
4. **Restart server**: The app will automatically use SendGrid

### **Benefits:**
- ✅ More reliable than Gmail
- ✅ 100 emails/day free
- ✅ No app password issues
- ✅ Better deliverability

## 🔧 **Option 2: Fix Gmail App Password**

If you prefer to stick with Gmail:

### **Current Process (2024):**
1. **Enable 2FA**: https://myaccount.google.com/security
2. **Generate App Password**: https://myaccount.google.com/apppasswords
3. **Select App**: Choose "Mail" or "Other (Custom name)" → type "Mail"
4. **Copy Password**: Remove spaces when adding to .env
5. **Update .env**:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=kilo.pixel@gmail.com
   EMAIL_PASS=your_16_character_password_no_spaces
   EMAIL_FROM=kilo.pixel@gmail.com
   ```

## 🔧 **Option 3: Use Your Own SMTP**

If you have your own email server:
```env
EMAIL_SERVICE=custom
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
EMAIL_FROM=your-email@domain.com
```

## 🚀 **Quick Test**

After updating your .env file, the server will restart automatically. Try sending an email again!

## 💡 **Recommendation**

For production use, I recommend **SendGrid** because:
- More reliable than Gmail app passwords
- Better deliverability
- Easier setup
- Free tier is generous
- No 2FA requirements


