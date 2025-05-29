"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/home/sections/navbar";
import { useParams } from "next/navigation";
import { FlickeringGrid } from "@/components/home/ui/flickering-grid";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Reuse the CodeExample interface
interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: string;
  icon?: string;
  tags: string[];
  code: string;
}

// Default examples as fallback if JSON fetch fails
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
                  8500, 9200, 8100, 7200, 6800, 7600],
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
    fig1 = px.line(
        df, 
        x='Month', 
        y=['Sales', 'Expenses', 'Profit'],
        title='Monthly Financial Performance',
        labels={'value': 'Amount ($)', 'variable': 'Metric'},
        template='plotly_dark',
        line_shape='spline',
        markers=True
    )
    
    # Create a bar chart for profit
    fig2 = px.bar(
        df,
        x='Month',
        y='Profit',
        title='Monthly Profit',
        labels={'Profit': 'Profit ($)'},
        template='plotly_dark',
        color='Profit',
        color_continuous_scale='Viridis'
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
    tags: ["web scraping", "BeautifulSoup", "automation"],
    code: `import requests
from bs4 import BeautifulSoup
import csv
import time
import random

# Target URL (replace with the actual e-commerce site you want to scrape)
target_url = "https://example-ecommerce.com/products"

# User agent to mimic a real browser
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
        
        # Send request with delay to avoid IP ban
        print(f"Scraping page {current_page}: {paginated_url}")
        response = requests.get(paginated_url, headers=HEADERS)
        
        # Check if request was successful
        if response.status_code != 200:
            print(f"Failed to retrieve page {current_page}: Status code {response.status_code}")
            break
        
        # Parse HTML content
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Find all product containers (adjust the selector for your target site)
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
                
                # Optional: Extract more data like ratings, availability, etc.
                product_rating = container.select_one(".product-rating").text.strip() if container.select_one(".product-rating") else "N/A"
                product_url = container.select_one("a")["href"]
                
                # Add product to list
                all_products.append({
                    "name": product_name,
                    "price": product_price,
                    "rating": product_rating,
                    "url": product_url if product_url.startswith("http") else f"https://example-ecommerce.com{product_url}"
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
        fieldnames = ["name", "price", "rating", "url"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for product in products:
            writer.writerow(product)
    
    print(f"Saved {len(products)} products to {filename}")

def main():
    """Main function to run the scraper."""
    print(f"Starting web scraper for {target_url}")
    
    # Scrape products
    products = scrape_product_listings(target_url)
    
    # Save results
    if products:
        save_to_csv(products)

if __name__ == "__main__":
    main()`,
  },
];

export default function CodeExamplePage() {
  const params = useParams();
  const codeId = params.codeId as string;
  const [copied, setCopied] = useState(false);
  const [allExamples, setAllExamples] = useState<CodeExample[]>(defaultExampleCodes);
  const [loading, setLoading] = useState(true);
  const [example, setExample] = useState<CodeExample | undefined>(undefined);

  // Load examples from JSON file and find the one that matches the codeId
  useEffect(() => {
    async function loadExamples() {
      try {
        setLoading(true);
        const response = await fetch('/data/code-examples.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load code examples: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data.examples)) {
          // Use examples from JSON
          setAllExamples(data.examples);
          // Find the example based on the codeId parameter
          const foundExample = data.examples.find((code: CodeExample) => code.id === params.codeId);
          setExample(foundExample);
        } else {
          // Fallback to default examples if JSON structure is incorrect
          console.warn('Invalid JSON structure in code-examples.json');
          const fallbackExample = defaultExampleCodes.find(code => code.id === params.codeId);
          setExample(fallbackExample);
        }
      } catch (error) {
        console.error('Error loading code examples:', error);
        // Fallback to default examples on error
        const fallbackExample = defaultExampleCodes.find(code => code.id === params.codeId);
        setExample(fallbackExample);
      } finally {
        setLoading(false);
      }
    }
    
    loadExamples();
  }, [params.codeId]);

  const copyToClipboard = () => {
    if (example) {
      navigator.clipboard.writeText(example.code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-950 p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </main>
    );
  }

  // If no example found, show a not found message
  if (!example) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-950 p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Example Not Found</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">The example you're looking for doesn't exist or has been moved.</p>
        <Button asChild className="mt-8">
          <Link href="/example-code">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Examples
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <Navbar />
      
      {/* Hero section with flickering grid */}
      <section className="relative w-full bg-black py-24 md:py-32">
        <FlickeringGrid maxOpacity={0.2} />
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col items-start max-w-5xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 text-gray-400 hover:text-black dark:hover:text-white"
              asChild
            >
              <Link href="/example-code">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Example Code
              </Link>
            </Button>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                {example.icon && (
                  <span className="text-2xl">{example.icon}</span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-white">{example.title}</h1>
              </div>
              <p className="text-xl text-gray-300">{example.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {example.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Main content */}
      <section className="container max-w-5xl mx-auto relative z-10 py-12 px-4">
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg">
          <div className="flex justify-between items-center p-4 bg-gray-200 dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {example.language}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyToClipboard}
                className={cn(
                  "hover:bg-gray-300 dark:hover:bg-gray-700",
                  copied ? "text-green-500" : "text-gray-600 dark:text-gray-300"
                )}
              >
                {copied ? "Copied!" : "Copy"} 
                <Copy className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto p-4 bg-gray-100 dark:bg-gray-900">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
              {example.code}
            </pre>
          </div>
        </div>
        
        {/* Additional resources section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Start Your Own Project</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Ready to build your own project? Let Machine AI help you get started with custom code tailored to your needs.
          </p>
          <Button asChild size="lg" className="gap-2 bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-medium">
            <Link href="/auth">
              <span>Try It Now</span>
              <ExternalLink className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
