import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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

    // Launch Puppeteer with Chromium for serverless
    // In production (Vercel), use @sparticuz/chromium
    // In development, use local Chrome if available
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    
    const launchOptions: any = {
      args: isProduction ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    };

    if (isProduction) {
      launchOptions.executablePath = await chromium.executablePath();
    } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
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
