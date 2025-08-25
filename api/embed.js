const express = require('express');
const router = express.Router();

// Embeddable form API endpoint
router.get('/embed', (req, res) => {
  const {
    title = 'AI Lead Capture',
    subtitle = 'Get a personalized call from our AI assistant',
    buttonText = '📞 Start AI Call',
    theme = 'light', // light, dark, blue, green
    width = '100%',
    height = 'auto',
    apiUrl = req.protocol + '://' + req.get('host'),
    successMessage = 'Call initiated successfully! Our AI will call you shortly.',
    errorMessage = 'Something went wrong. Please try again.'
  } = req.query;

  const css = `
    .ai-lead-form {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      background: ${theme === 'dark' ? '#1a1a1a' : theme === 'blue' ? '#f0f8ff' : theme === 'green' ? '#f0fff4' : '#ffffff'};
      color: ${theme === 'dark' ? '#ffffff' : '#333333'};
      border: 1px solid ${theme === 'dark' ? '#333333' : '#e1e5e9'};
    }
    
    .ai-lead-form h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: ${theme === 'dark' ? '#ffffff' : '#1a1a1a'};
      text-align: center;
    }
    
    .ai-lead-form p {
      margin: 0 0 24px 0;
      font-size: 16px;
      color: ${theme === 'dark' ? '#cccccc' : '#666666'};
      text-align: center;
      line-height: 1.5;
    }
    
    .ai-lead-form .form-group {
      margin-bottom: 20px;
    }
    
    .ai-lead-form label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: ${theme === 'dark' ? '#ffffff' : '#333333'};
      font-size: 14px;
    }
    
    .ai-lead-form input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid ${theme === 'dark' ? '#333333' : '#e1e5e9'};
      border-radius: 8px;
      font-size: 16px;
      background: ${theme === 'dark' ? '#2a2a2a' : '#ffffff'};
      color: ${theme === 'dark' ? '#ffffff' : '#333333'};
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }
    
    .ai-lead-form input:focus {
      outline: none;
      border-color: ${theme === 'blue' ? '#3b82f6' : theme === 'green' ? '#10b981' : '#6366f1'};
    }
    
    .ai-lead-form button {
      width: 100%;
      padding: 14px 24px;
      background: ${theme === 'blue' ? '#3b82f6' : theme === 'green' ? '#10b981' : '#6366f1'};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .ai-lead-form button:hover {
      background: ${theme === 'blue' ? '#2563eb' : theme === 'green' ? '#059669' : '#4f46e5'};
      transform: translateY(-1px);
    }
    
    .ai-lead-form button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }
    
    .ai-lead-form .result {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      display: none;
    }
    
    .ai-lead-form .result.success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    
    .ai-lead-form .result.error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    
    .ai-lead-form .result.loading {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #93c5fd;
    }
    
    .ai-lead-form .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .ai-lead-form .powered-by {
      margin-top: 16px;
      text-align: center;
      font-size: 12px;
      color: ${theme === 'dark' ? '#666666' : '#999999'};
    }
    
    .ai-lead-form .powered-by a {
      color: ${theme === 'blue' ? '#3b82f6' : theme === 'green' ? '#10b981' : '#6366f1'};
      text-decoration: none;
    }
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="ai-lead-form" style="width: ${width}; height: ${height};">
        <h2>${title}</h2>
        <p>${subtitle}</p>
        
        <form id="leadForm">
          <div class="form-group">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" required placeholder="Enter your full name">
          </div>
          
          <div class="form-group">
            <label for="phone">Phone Number *</label>
            <input type="tel" id="phone" name="phone" required placeholder="Enter your phone number">
          </div>
          
          <button type="submit" id="submitBtn">
            <span>${buttonText}</span>
          </button>
        </form>
        
        <div id="result" class="result"></div>
        
        <div class="powered-by">
          Powered by <a href="${apiUrl}" target="_blank">AI Lead Capture</a>
        </div>
      </div>

      <script>
        document.getElementById('leadForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const name = document.getElementById('name').value.trim();
          const phone = document.getElementById('phone').value.trim();
          const submitBtn = document.getElementById('submitBtn');
          const resultDiv = document.getElementById('result');
          
          if (!name || !phone) {
            showResult('Please fill in both name and phone number fields.', 'error');
            return;
          }
          
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="loading-spinner"></span> Initiating Call...';
          showResult('Initiating AI call... Please wait.', 'loading');
          
          try {
            const response = await fetch('${apiUrl}/api/call-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: name,
                phoneNumber: phone
              }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Server response:', errorText);
              showResult('${errorMessage}', 'error');
              return;
            }
            
            const result = await response.json();
            if (result.success) {
              showResult('${successMessage}', 'success');
              document.getElementById('leadForm').reset();
            } else {
              showResult(result.error || '${errorMessage}', 'error');
            }
          } catch (error) {
            console.error('Fetch error:', error);
            showResult('Network error: ' + error.message, 'error');
          } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>${buttonText}</span>';
          }
        });
        
        function showResult(message, type) {
          const resultDiv = document.getElementById('result');
          resultDiv.textContent = message;
          resultDiv.className = 'result ' + type;
          resultDiv.style.display = 'block';
        }
        
        // Phone number formatting
        document.getElementById('phone').addEventListener('input', function(e) {
          let value = e.target.value.replace(/\\D/g, '');
          if (value.length > 0) {
            if (value.length <= 3) {
              value = '(' + value;
            } else if (value.length <= 6) {
              value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
            } else {
              value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
            }
          }
          e.target.value = value;
        });
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.send(html);
});

// JSON API endpoint for programmatic access
router.post('/api/embed', (req, res) => {
  const {
    name,
    phoneNumber,
    title,
    subtitle,
    buttonText,
    theme,
    width,
    height,
    successMessage,
    errorMessage
  } = req.body;

  if (!name || !phoneNumber) {
    return res.status(400).json({
      success: false,
      error: 'Name and phone number are required'
    });
  }

  // Forward the request to the main call-user endpoint
  const callUserUrl = `${req.protocol}://${req.get('host')}/api/call-user`;
  
  fetch(callUserUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, phoneNumber }),
  })
  .then(response => response.json())
  .then(data => {
    res.json(data);
  })
  .catch(error => {
    console.error('Error forwarding request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });
});

module.exports = router;
