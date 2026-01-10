import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

/**
 * POST /api/bill/pdf
 * Generate PDF using Puppeteer (server-side)
 */
export async function POST(request: NextRequest) {
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Set content with HTML
      await page.setContent(html, {
        waitUntil: 'networkidle0',
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
      await browser.close();
      throw error;
    }
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
