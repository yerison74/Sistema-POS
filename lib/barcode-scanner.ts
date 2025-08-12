// Simulated barcode scanner functionality
export class BarcodeScanner {
  private static instance: BarcodeScanner
  private isListening = false
  private buffer = ""
  private timeout: NodeJS.Timeout | null = null
  private onScanCallback: ((code: string) => void) | null = null

  private constructor() {
    this.setupKeyboardListener()
  }

  static getInstance(): BarcodeScanner {
    if (!BarcodeScanner.instance) {
      BarcodeScanner.instance = new BarcodeScanner()
    }
    return BarcodeScanner.instance
  }

  private setupKeyboardListener() {
    if (typeof window === "undefined") return

    document.addEventListener("keydown", (event) => {
      if (!this.isListening) return

      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      // Handle Enter key (end of barcode scan)
      if (event.key === "Enter") {
        if (this.buffer.length > 0) {
          this.processScan(this.buffer)
          this.buffer = ""
        }
        return
      }

      // Handle regular characters
      if (event.key.length === 1) {
        this.buffer += event.key

        // Reset timeout
        if (this.timeout) {
          clearTimeout(this.timeout)
        }

        // Auto-process if no input for 100ms (typical for barcode scanners)
        this.timeout = setTimeout(() => {
          if (this.buffer.length > 0) {
            this.processScan(this.buffer)
            this.buffer = ""
          }
        }, 100)
      }
    })
  }

  private processScan(code: string) {
    // Validate barcode format (basic validation)
    if (code.length >= 3 && /^[0-9A-Za-z]+$/.test(code)) {
      this.onScanCallback?.(code)
    }
  }

  startListening(callback: (code: string) => void) {
    this.isListening = true
    this.onScanCallback = callback
    this.buffer = ""
  }

  stopListening() {
    this.isListening = false
    this.onScanCallback = null
    this.buffer = ""
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  // Simulate a barcode scan (for testing)
  simulateScan(code: string) {
    if (this.isListening && this.onScanCallback) {
      this.onScanCallback(code)
    }
  }
}
