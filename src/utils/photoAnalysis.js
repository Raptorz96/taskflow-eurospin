import { createWorker } from 'tesseract.js'

export const analyzePhoto = async (imageData) => {
  try {
    const worker = await createWorker('ita')
    const { data: { text } } = await worker.recognize(imageData)
    await worker.terminate()

    const analysis = {
      extractedText: text,
      contentType: determineContentType(text),
      suggestedData: extractRelevantData(text)
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing photo:', error)
    return {
      extractedText: '',
      contentType: 'unknown',
      suggestedData: {}
    }
  }
}

const determineContentType = (text) => {
  const lowerText = text.toLowerCase()
  
  // Check for product indicators
  const productKeywords = [
    'euro', '€', 'prezzo', 'sconto', 'offerta', 'kg', 'gr', 'ml', 'lt',
    'pz', 'confezione', 'barcode', 'codice', 'prodotto'
  ]
  
  // Check for date patterns (scadenze)
  const datePattern = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g
  const hasDate = datePattern.test(text)
  
  // Check for document indicators
  const documentKeywords = [
    'documento', 'lettera', 'email', 'mail', 'comunicazione', 
    'avviso', 'nota', 'memo', 'report', 'fattura'
  ]
  
  const hasProductKeywords = productKeywords.some(keyword => 
    lowerText.includes(keyword)
  )
  
  const hasDocumentKeywords = documentKeywords.some(keyword => 
    lowerText.includes(keyword)
  )
  
  if (hasDate && hasProductKeywords) {
    return 'scadenza'
  } else if (hasProductKeywords) {
    return 'prodotto'
  } else if (hasDocumentKeywords || text.length > 100) {
    return 'documento'
  } else if (hasDate) {
    return 'scadenza'
  }
  
  return 'prodotto' // Default fallback
}

const extractRelevantData = (text) => {
  const data = {}
  
  // Extract prices
  const pricePattern = /€?\s*(\d+[.,]\d{2})\s*€?/g
  const priceMatches = [...text.matchAll(pricePattern)]
  if (priceMatches.length > 0) {
    data.prezzo = priceMatches[0][1].replace(',', '.')
  }
  
  // Extract dates
  const datePattern = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g
  const dateMatches = [...text.matchAll(datePattern)]
  if (dateMatches.length > 0) {
    const [, day, month, year] = dateMatches[0]
    const fullYear = year.length === 2 ? `20${year}` : year
    data.scadenza = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${fullYear}`
  }
  
  // Extract quantities
  const quantityPattern = /(\d+)\s*(kg|gr|ml|lt|pz|pezzi|confezioni?)/gi
  const quantityMatches = [...text.matchAll(quantityPattern)]
  if (quantityMatches.length > 0) {
    data.quantita = `${quantityMatches[0][1]} ${quantityMatches[0][2].toLowerCase()}`
  }
  
  // Extract product name (first meaningful line)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2)
  if (lines.length > 0) {
    // Find the longest line that's not just numbers/symbols
    const meaningfulLines = lines.filter(line => 
      line.length > 3 && /[a-zA-Z]/.test(line) && line.length < 50
    )
    if (meaningfulLines.length > 0) {
      data.nome = meaningfulLines[0]
    }
  }
  
  return data
}

export const suggestTaskCategory = (contentType, extractedData) => {
  switch (contentType) {
    case 'scadenza':
      return 'Avviso'
    case 'prodotto':
      return extractedData.prezzo ? 'Controllo' : 'Ripasso'
    case 'documento':
      return 'Controllo'
    default:
      return 'Ripasso'
  }
}

export const generateTaskTitle = (contentType, extractedData) => {
  switch (contentType) {
    case 'scadenza':
      const prodotto = extractedData.nome || 'Prodotto'
      const scadenza = extractedData.scadenza || 'data da verificare'
      return `Scadenza ${prodotto} - ${scadenza}`
    
    case 'prodotto':
      const nome = extractedData.nome || 'Nuovo prodotto'
      const prezzo = extractedData.prezzo ? ` - €${extractedData.prezzo}` : ''
      return `${nome}${prezzo}`
    
    case 'documento':
      return extractedData.nome || 'Documento da verificare'
    
    default:
      return extractedData.nome || 'Task da foto'
  }
}