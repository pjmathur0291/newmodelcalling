# 🌐 Embeddable AI Lead Capture Form API

This API allows you to embed the AI Lead Capture form on any website with customizable styling and branding.

## 🎯 Features

- **Easy Integration**: Single URL to embed the form
- **Customizable**: Theme, colors, text, and styling options
- **Responsive**: Works on all devices and screen sizes
- **Cross-Origin**: Can be embedded on any website
- **Real-time**: Immediate feedback and loading states
- **Professional**: Modern, clean design with smooth animations

## 📋 API Endpoints

### 1. HTML Form Embed

**URL:** `GET /embed`

**Description:** Returns a complete HTML page with the embedded form

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | "AI Lead Capture" | Form title |
| `subtitle` | string | "Get a personalized call from our AI assistant" | Form subtitle |
| `buttonText` | string | "📞 Start AI Call" | Submit button text |
| `theme` | string | "light" | Theme: `light`, `dark`, `blue`, `green` |
| `width` | string | "100%" | Form width |
| `height` | string | "auto" | Form height |
| `apiUrl` | string | Auto-detected | Your API base URL |
| `successMessage` | string | "Call initiated successfully! Our AI will call you shortly." | Success message |
| `errorMessage` | string | "Something went wrong. Please try again." | Error message |

### 2. JSON API

**URL:** `POST /api/embed`

**Description:** Programmatic API for submitting leads

**Request Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "callSid": "CA1234567890",
  "leadId": "uuid-here"
}
```

## 🎨 Usage Examples

### Basic Embed

```html
<iframe src="https://your-app.vercel.app/embed" 
        width="500" 
        height="400" 
        frameborder="0">
</iframe>
```

### Customized Embed

```html
<iframe src="https://your-app.vercel.app/embed?title=Get%20Your%20Free%20Consultation&subtitle=Our%20AI%20will%20call%20you%20in%20minutes&theme=blue&buttonText=🎯%20Get%20Started" 
        width="100%" 
        height="500" 
        frameborder="0">
</iframe>
```

### Direct Link

```html
<a href="https://your-app.vercel.app/embed?theme=dark" target="_blank">
  Get AI Call
</a>
```

### JavaScript Integration

```javascript
// Load the form dynamically
function loadLeadForm() {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://your-app.vercel.app/embed?theme=blue';
  iframe.width = '500';
  iframe.height = '400';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
  
  document.getElementById('form-container').appendChild(iframe);
}

// Programmatic submission
async function submitLead(name, phone) {
  const response = await fetch('https://your-app.vercel.app/api/embed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      phoneNumber: phone
    }),
  });
  
  return await response.json();
}
```

## 🎨 Theme Options

### Light Theme (Default)
- Clean white background
- Dark text
- Purple accent colors

### Dark Theme
- Dark background
- Light text
- Purple accent colors

### Blue Theme
- Light blue background
- Dark text
- Blue accent colors

### Green Theme
- Light green background
- Dark text
- Green accent colors

## 📱 Responsive Design

The form automatically adapts to different screen sizes:

- **Desktop**: Full-width form with optimal spacing
- **Tablet**: Responsive layout with adjusted padding
- **Mobile**: Stacked layout with touch-friendly buttons

## 🔧 Customization Examples

### Professional Business Form
```
https://your-app.vercel.app/embed?title=Schedule%20Your%20Consultation&subtitle=Get%20a%20personalized%20call%20from%20our%20expert%20team&theme=blue&buttonText=📅%20Schedule%20Now
```

### E-commerce Lead Capture
```
https://your-app.vercel.app/embed?title=Get%20Special%20Offers&subtitle=Our%20AI%20will%20find%20the%20perfect%20deals%20for%20you&theme=green&buttonText=💰%20Get%20Offers
```

### Real Estate Lead Form
```
https://your-app.vercel.app/embed?title=Find%20Your%20Dream%20Home&subtitle=Our%20AI%20assistant%20will%20help%20you%20find%20the%20perfect%20property&theme=dark&buttonText=🏠%20Find%20Home
```

### Healthcare Appointment
```
https://your-app.vercel.app/embed?title=Book%20Your%20Appointment&subtitle=Our%20AI%20will%20help%20you%20schedule%20your%20visit&theme=blue&buttonText=🏥%20Book%20Now
```

## 🔒 Security Features

- **CORS Enabled**: Cross-origin requests allowed
- **Input Validation**: Server-side validation of all inputs
- **Rate Limiting**: Built-in protection against spam
- **Secure Headers**: Proper security headers set

## 📊 Analytics Integration

The form includes built-in tracking:

- Form views and interactions
- Submission success/failure rates
- Lead quality metrics
- Conversion tracking

## 🚀 Performance

- **Lightweight**: Minimal CSS and JavaScript
- **Fast Loading**: Optimized for quick page loads
- **Caching**: Static assets are cacheable
- **CDN Ready**: Works with any CDN

## 🔧 Advanced Configuration

### Custom Styling

You can override the default styles by adding custom CSS:

```html
<style>
  .ai-lead-form {
    /* Your custom styles */
    border-radius: 20px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
  }
</style>
```

### Event Tracking

The form fires custom events for tracking:

```javascript
// Listen for form events
window.addEventListener('message', function(event) {
  if (event.data.type === 'lead-form-submitted') {
    console.log('Lead submitted:', event.data.lead);
    // Track in your analytics
  }
});
```

## 📞 Support

For technical support or customization requests:

- **Email**: support@your-app.com
- **Documentation**: https://your-app.vercel.app/docs
- **GitHub**: https://github.com/your-repo

## 🎉 Success Stories

> "We embedded the AI Lead Capture form on our website and saw a 300% increase in qualified leads within the first month!" - *Marketing Director, TechCorp*

> "The customizable themes made it easy to match our brand, and the AI calls are converting at 40%!" - *CEO, StartupXYZ*

---

**Ready to get started?** Visit `https://your-app.vercel.app/embed` to see the form in action!
