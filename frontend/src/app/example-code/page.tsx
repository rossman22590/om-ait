"use client";

import { FlickeringGrid } from "@/components/home/ui/flickering-grid";
import { ArrowRight, Copy, ExternalLink, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/home/sections/navbar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: string;
  icon?: string;
  tags: string[];
  code: string;
}

// Example code structure - these are the default examples
const defaultExampleCodes: CodeExample[] = [
  {
    id: "netlify-deploy",
    title: "Deploy to Netlify",
    description: "Python script to automate deployment to Netlify",
    language: "python",
    icon: "🚀",
    tags: ["deployment", "automation", "netlify"],
    code: `import os
import requests
import json
import time
import zipfile
import tempfile
import shutil

# Netlify API credentials
NETLIFY_API_TOKEN = "nfp_y18gz9tbir8366"
SITE_NAME = "florist-elegant-landing"

# Directory to deploy
DIRECTORY_PATH = "/workspace/cloudflare"

def create_zip_archive(directory_path):
    """Create a zip archive of the directory to deploy."""
    temp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(temp_dir, "deploy.zip")
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, directory_path)
                zipf.write(file_path, arcname)
    
    return zip_path, temp_dir

def deploy_to_netlify(zip_path):
    """Deploy the zip archive to Netlify."""
    # Get site ID using the site name
    sites_url = "https://api.netlify.com/api/v1/sites"
    headers = {
        "Authorization": f"Bearer {NETLIFY_API_TOKEN}"
    }
    
    response = requests.get(sites_url, headers=headers)
    sites = response.json()
    
    site_id = None
    for site in sites:
        if site["name"] == SITE_NAME:
            site_id = site["id"]
            break
    
    if not site_id:
        print(f"Site '{SITE_NAME}' not found")
        return False
    
    # Deploy to the site
    deploy_url = f"https://api.netlify.com/api/v1/sites/{site_id}/deploys"
    
    with open(zip_path, 'rb') as zip_file:
        files = {'file': zip_file}
        response = requests.post(deploy_url, headers=headers, files=files)
    
    if response.status_code == 200:
        deploy_data = response.json()
        print(f"Deployment successful. Deployment URL: {deploy_data['deploy_url']}")
        return True
    else:
        print(f"Deployment failed with status code {response.status_code}")
        print(response.text)
        return False

def main():
    print(f"Creating ZIP archive of {DIRECTORY_PATH}...")
    zip_path, temp_dir = create_zip_archive(DIRECTORY_PATH)
    
    try:
        print("Deploying to Netlify...")
        deploy_to_netlify(zip_path)
    finally:
        # Clean up
        shutil.rmtree(temp_dir)
        print("Temporary files removed")

if __name__ == "__main__":
    main()`,
  },
  {
    id: "data-visualization",
    title: "Interactive Data Visualization",
    description: "Create interactive charts with Python and Plotly",
    language: "python",
    icon: "📊",
    tags: ["visualization", "data science", "plotly"],
    code: `import pandas as pd
import plotly.express as px
import plotly.io as pio

# Sample data creation
def generate_sample_data():
    """Generate sample sales data for visualization."""
    data = {
        'Month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        'Sales': [4200, 4800, 5100, 5400, 6200, 7100, 
                  8500, 9200, 8100, 7200, 6500, 7800],
        'Expenses': [3800, 4100, 4300, 4500, 5100, 5700, 
                     6200, 6800, 6300, 5900, 5200, 6100],
        'Profit': [400, 700, 800, 900, 1100, 1400, 
                   2300, 2400, 1800, 1300, 1300, 1700]
    }
    return pd.DataFrame(data)

def create_visualization():
    """Create interactive data visualizations using Plotly."""
    # Generate data
    df = generate_sample_data()
    
    # Create a line chart for sales and expenses
    fig1 = px.line(df, x='Month', y=['Sales', 'Expenses', 'Profit'], 
                   title='Monthly Financial Performance',
                   template='plotly_white')
    
    # Customize layout
    fig1.update_layout(
        xaxis_title='Month',
        yaxis_title='Amount ($)',
        legend_title='Metric',
        hovermode='x unified'
    )
    
    # Create a bar chart for profit
    fig2 = px.bar(df, x='Month', y='Profit', 
                  title='Monthly Profit',
                  template='plotly_white',
                  color='Profit',
                  color_continuous_scale=px.colors.sequential.Viridis)
    
    # Customize layout
    fig2.update_layout(
        xaxis_title='Month',
        yaxis_title='Profit ($)',
        coloraxis_showscale=False
    )
    
    # Save the figures as HTML files
    pio.write_html(fig1, 'financial_performance.html', auto_open=True)
    pio.write_html(fig2, 'monthly_profit.html', auto_open=True)
    
    print("Visualizations created and saved as HTML files")

if __name__ == "__main__":
    create_visualization()`,
  },
  {
    id: "web-scraper",
    title: "Web Scraper with BeautifulSoup",
    description: "Python script to scrape product information from e-commerce sites",
    language: "python",
    icon: "🔍",
    tags: ["web scraping", "data extraction", "beautifulsoup"],
    code: `import requests
from bs4 import BeautifulSoup
import csv
import time
import random
from urllib.parse import urljoin

# User agent to mimic a browser
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Headers for the request
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept-Language": "en-US,en;q=0.5",
}

def scrape_product_listings(url, max_pages=3):
    """Scrape product listings from an e-commerce site."""
    all_products = []
    current_page = 1
    
    while current_page <= max_pages:
        # Construct the URL for pagination
        if current_page > 1:
            paginated_url = f"{url}?page={current_page}"
        else:
            paginated_url = url
        
        print(f"Scraping page {current_page}: {paginated_url}")
        
        # Send request with a delay to be respectful
        time.sleep(random.uniform(1.0, 3.0))
        response = requests.get(paginated_url, headers=HEADERS)
        
        if response.status_code != 200:
            print(f"Failed to retrieve page {current_page}: Status code {response.status_code}")
            break
        
        # Parse the HTML content
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Find product containers (this selector needs to be adjusted for specific sites)
        product_containers = soup.select(".product-item")
        
        if not product_containers:
            print(f"No products found on page {current_page}")
            break
        
        # Extract data from each product
        for container in product_containers:
            try:
                # Extract product details (adjust selectors for specific sites)
                product_name = container.select_one(".product-name").text.strip()
                product_price = container.select_one(".product-price").text.strip()
                
                # Get the relative URL and convert to absolute
                product_url_rel = container.select_one("a")["href"]
                product_url = urljoin(url, product_url_rel)
                
                # Try to get image URL
                img_element = container.select_one("img")
                product_image = img_element["src"] if img_element else "No image"
                
                # Add to product list
                all_products.append({
                    "name": product_name,
                    "price": product_price,
                    "url": product_url,
                    "image": product_image
                })
                
            except Exception as e:
                print(f"Error extracting product details: {str(e)}")
        
        print(f"Extracted {len(product_containers)} products from page {current_page}")
        current_page += 1
    
    return all_products

def save_to_csv(products, filename="products.csv"):
    """Save the scraped products to a CSV file."""
    if not products:
        print("No products to save")
        return
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = products[0].keys()
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for product in products:
            writer.writerow(product)
    
    print(f"Saved {len(products)} products to {filename}")

def main():
    # Replace with the target e-commerce URL
    target_url = "https://example-ecommerce.com/products"
    
    # Scrape products
    products = scrape_product_listings(target_url)
    
    # Save results
    if products:
        save_to_csv(products)

if __name__ == "__main__":
    main()`,
  },
];

// Component for code card with syntax highlighting
const CodeCard = ({ example }: { example: CodeExample }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const copyToClipboard = async (e: React.MouseEvent) => {
    // Prevent the link navigation when clicking the copy button
    e.stopPropagation();
    e.preventDefault();
    
    try {
      await navigator.clipboard.writeText(example.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <Link href={`/example-code/${example.id}`} className="block">
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border border-transparent hover:border-pink-200 dark:hover:border-pink-800 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <motion.span 
                className="text-2xl"
                animate={{ scale: isHovered ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                {example.icon || "📄"}
              </motion.span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{example.title}</h3>
            </div>
            <motion.button
              onClick={copyToClipboard}
              className={cn(
                "p-2 rounded-md text-white transition-all duration-300 flex items-center gap-2",
                isCopied 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
              )}
              title="Copy code"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCopied ? (
                <>
                  <span className="text-sm font-medium">Copied!</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                  </svg>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">Copy</span>
                  <Copy size={15} />
                </>
              )}
            </motion.button>
          </div>
          
          <p className="mt-2 mb-4 text-gray-600 dark:text-gray-300">{example.description}</p>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative mt-4 mb-4 overflow-hidden rounded-md bg-gray-900 p-4 h-64 overflow-y-auto">
              <pre className="text-gray-300 text-sm">
                <code>{example.code}</code>
              </pre>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={copyToClipboard}
                  className={cn(
                    "p-2 rounded-md text-white transition-all duration-300",
                    isCopied ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
                  )}
                  title="Copy code"
                >
                  {isCopied ? (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function ExampleCodePage() {
  // State to store all example codes (default + from JSON)
  const [exampleCodes, setExampleCodes] = useState<CodeExample[]>(defaultExampleCodes);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load additional examples from JSON file
  useEffect(() => {
    async function loadApiExamples() {
      try {
        const response = await fetch('/data/code-examples.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load API examples: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Combine default examples with API examples
        setExampleCodes([...defaultExampleCodes, ...data.examples]);
      } catch (error) {
        console.error('Error loading API examples:', error);
      }
    }
    
    loadApiExamples();
  }, []);
  
  // Filter examples based on search query
  const filteredExamples = useMemo(() => {
    if (!searchQuery.trim()) {
      return exampleCodes;
    }
    
    const query = searchQuery.toLowerCase();
    return exampleCodes.filter(example => 
      example.title.toLowerCase().includes(query) ||
      example.description.toLowerCase().includes(query) ||
      example.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [exampleCodes, searchQuery]);

  return (
    <main className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      {/* Hero section */}
      <section className="w-full py-20 lg:py-28 relative overflow-hidden bg-white dark:bg-gray-900">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute w-full h-full">
            <FlickeringGrid
              squareSize={2.2}
              gridGap={20}
              color="var(--primary)"
              maxOpacity={0.2}
              flickerChance={0.04}
            />
          </div>
        </div>
        
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <div className="inline-block rounded-full bg-pink-100 dark:bg-pink-900/30 px-3 py-1 text-sm text-pink-600 dark:text-pink-300 mb-4">
              Code Snippets Library
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-pink-500 dark:from-white dark:to-pink-400">
              Example Code
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
              Ready-to-use code snippets for common tasks. Copy, paste, and deploy with ease.
            </p>
          </div>
          <div className="flex justify-center mt-8">
            <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="container max-w-7xl mx-auto relative z-10 py-8 px-4">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full bg-gray-100 dark:bg-gray-800 border-0 rounded-lg py-3 pl-10 pr-10 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-600"
              placeholder="Search by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Found {filteredExamples.length} example{filteredExamples.length !== 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {/* Example Code Grid */}
      <section className="container max-w-7xl mx-auto relative z-10 pb-20 px-4">
        {filteredExamples.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {filteredExamples.map((example) => (
              <CodeCard key={example.id} example={example} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 dark:text-gray-300">No examples found matching your search.</p>
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Clear Search
            </Button>
          </div>
        )}
      </section>

      {/* CTA section */}
      <section className="w-full py-16 bg-black border-t border-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Need a custom solution?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Let AI Tutor Machine help you create custom code for your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="gap-2 bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-medium">
                <Link href="/auth">
                  <span>Get Started</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
                <Link href="/faq">
                  <span>Learn More</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &copy; {new Date().getFullYear()} Machine. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Home
              </Link>
              <Link href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                About
              </Link>
              <Link href="/faq" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                FAQ
              </Link>
              <Link href="/legal" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Legal
              </Link>
              <Link href="/#pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}