import { NextRequest, NextResponse } from 'next/server';

/**
 * Route segment config for Vercel
 * App Router me yeh format use hota hai (vercel.json nahi)
 */
export const maxDuration = 30; // 30 seconds for PDF generation
export const runtime = 'nodejs'; // Use Node.js runtime for Puppeteer

/**
 * POST /api/bill/pdf
 * Generate PDF using Puppeteer (server-side)
 * Optimized for Vercel serverless environment
 */
export async function POST(request: NextRequest) {
  let browser;
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Dynamically import puppeteer based on environment
    // In production (Vercel), use puppeteer-core with @sparticuz/chromium
    // In development, use regular puppeteer (includes Chromium)
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    
    let puppeteer: any;
    let chromium: any;
    
    if (isProduction) {
      // Production: Use puppeteer-core with @sparticuz/chromium
      puppeteer = (await import('puppeteer-core')).default;
      chromium = (await import('@sparticuz/chromium')).default;
    } else {
      // Development: Use regular puppeteer (includes Chromium)
      puppeteer = (await import('puppeteer')).default;
    }

    const launchOptions: any = {
      headless: true,
    };

    if (isProduction) {
      // Production: Use @sparticuz/chromium
      launchOptions.args = chromium.args;
      launchOptions.executablePath = await chromium.executablePath();
    } else {
      // Development: Use regular puppeteer args
      launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
    }
    
    browser = await puppeteer.launch(launchOptions);

    try {
      const page = await browser.newPage();
      
      // Set content with HTML - use shorter timeout for serverless
      await page.setContent(html, {
        waitUntil: 'domcontentloaded', // Changed from networkidle0 for faster processing
        timeout: 30000, // 30 second timeout
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await browser.close();

      // Return PDF as response - Convert Buffer to Uint8Array for Blob compatibility
      const uint8Array = new Uint8Array(pdfBuffer);
      const pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });
      return new Response(pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="bill-${Date.now()}.pdf"`,
        },
      });
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    
    // Ensure browser is closed even on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate PDF',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
