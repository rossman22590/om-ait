'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    Intercom: any;
    intercomSettings: any;
  }
}

const ChatbotWidget = () => {
  useEffect(() => {
    // Set up Intercom settings
    window.intercomSettings = {
      api_base: "https://api-iam.intercom.io",
      app_id: "cqwzmjsm",
    };
    
    // Intercom script
    (function(){
      const w = window as any;
      const ic = w.Intercom;
      if(typeof ic === "function"){
        ic('reattach_activator');
        ic('update', w.intercomSettings);
      } else {
        const d = document;
        const i: any = function(...args: any[]){
          (i.c as any)(args);
        };
        i.q = [];
        i.c = function(args: any){
          i.q.push(args);
        };
        w.Intercom = i;
        const l = function(){
          const s = d.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = 'https://widget.intercom.io/widget/cqwzmjsm';
          const x = d.getElementsByTagName('script')[0];
          x.parentNode?.insertBefore(s,x);
        };
        if(document.readyState === 'complete'){
          l();
        } else if('attachEvent' in w){
          (w as any).attachEvent('onload',l);
        } else {
          w.addEventListener('load',l,false);
        }
      }
    })();

    // Add custom positioning styles for Intercom
    const style = document.createElement('style');
    style.innerHTML = `
      .intercom-lightweight-app-launcher {
        bottom: 100px !important;
      }
      #intercom-container .intercom-launcher-frame {
        bottom: 100px !important;
      }
      #intercom-container {
        bottom: 100px !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <>
      <Script 
        id="intercom-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.intercomSettings = {
              api_base: "https://api-iam.intercom.io",
              app_id: "cqwzmjsm",
            };
          `,
        }}
      />
    </>
  );
}

export default ChatbotWidget;
