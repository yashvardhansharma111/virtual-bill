import axios from 'axios';

/**
 * Renflair SMS Configuration
 * Configure these in your .env.local file
 */
const RENFLAIR_API_KEY = process.env.RENFLAIR_API_KEY;
const RENFLAIR_API_BASE_URL = process.env.RENFLAIR_API_URL || 'https://sms.renflair.in';
// Custom message endpoint - try V2.php, V5.php, or contact Renflair for the correct endpoint
const RENFLAIR_CUSTOM_ENDPOINT = process.env.RENFLAIR_CUSTOM_ENDPOINT || 'V2.php';

interface SMSOptions {
  to: string;
  message: string;
  customerName?: string;
}

/**
 * Format phone number for Renflair (10 digits, no country code)
 */
function formatPhone(phone: string): string {
  // Remove all non-digits
  let formatted = phone.replace(/\D/g, '');
  
  // If it has country code (91), remove it
  if (formatted.length === 12 && formatted.startsWith('91')) {
    formatted = formatted.substring(2);
  }
  
  // If it has +91, remove it
  if (formatted.length === 13 && formatted.startsWith('9191')) {
    formatted = formatted.substring(2);
  }
  
  // Ensure it's 10 digits
  if (formatted.length !== 10) {
    throw new Error('Phone number must be 10 digits');
  }
  
  return formatted;
}

/**
 * Send SMS using Renflair API
 * Uses GET request with query parameters as per Renflair API documentation
 * For custom messages, we'll use a generic endpoint or V3.php format
 */
export async function sendSMS({ to, message, customerName }: SMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!RENFLAIR_API_KEY) {
      throw new Error('RENFLAIR_API_KEY is not configured');
    }

    // Format phone number (10 digits only)
    const formattedPhone = formatPhone(to);

    // Build URL with query parameters
    // Try using the custom message endpoint (V2.php, V5.php, etc.)
    // V3.php is for order confirmation templates, not custom messages
    const url = `${RENFLAIR_API_BASE_URL}/${RENFLAIR_CUSTOM_ENDPOINT}`;
    
    const params = new URLSearchParams({
      API: RENFLAIR_API_KEY,
      PHONE: formattedPhone,
    });

    // Try different parameter names for custom message
    // Common parameter names: MSG, MESSAGE, TEXT, CONTENT
    params.append('MSG', message);
    
    // Also try MESSAGE parameter (some APIs use this)
    // params.append('MESSAGE', message);

    // Make GET request as per Renflair API format
    const response = await axios.get(`${url}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    // Handle Renflair API response
    // Response might be JSON string or object
    let responseData;
    if (typeof response.data === 'string') {
      try {
        responseData = JSON.parse(response.data);
      } catch {
        // If not JSON, treat as plain text response
        responseData = { message: response.data };
      }
    } else {
      responseData = response.data;
    }
    
    // Check for success indicators
    if (
      responseData && 
      (
        responseData.status === 'success' || 
        responseData.success === true ||
        responseData.Status === 'Success' ||
        responseData.status === 'Success' ||
        response.status === 200
      )
    ) {
      console.log('✅ SMS sent successfully:', responseData);
      return {
        success: true,
        messageId: responseData.message_id || responseData.id || responseData.MessageID || responseData.messageId || 'unknown',
      };
    } else {
      console.error('❌ SMS API returned error:', responseData);
      return {
        success: false,
        error: responseData.message || responseData.error || responseData.Message || responseData.msg || 'Failed to send SMS',
      };
    }
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error);
    
    // Handle axios errors
    if (error.response) {
      let errorData;
      if (typeof error.response.data === 'string') {
        try {
          errorData = JSON.parse(error.response.data);
        } catch {
          errorData = { message: error.response.data };
        }
      } else {
        errorData = error.response.data;
      }
      
      return {
        success: false,
        error: errorData?.message || errorData?.error || errorData?.Message || errorData?.msg || `API Error: ${error.response.status}`,
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send outstanding balance reminder SMS
 */
export async function sendOutstandingBalanceSMS(
  phone: string,
  customerName: string,
  outstandingAmount: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Dear ${customerName}, your outstanding balance is ₹${outstandingAmount.toLocaleString('en-IN')}. Please settle at your earliest convenience. Thank you - Virtual Bill`;
  
  return sendSMS({
    to: phone,
    message,
    customerName,
  });
}

/**
 * Send custom SMS message
 */
export async function sendCustomSMS(
  phone: string,
  message: string,
  customerName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendSMS({
    to: phone,
    message,
    customerName,
  });
}
