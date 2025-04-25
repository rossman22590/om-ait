"use client";

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
      var w = window as any;
      var ic = w.Intercom;
      if(typeof ic === "function"){
        ic('reattach_activator');
        ic('update', w.intercomSettings);
      } else {
        var d = document;
        var i: any = function(){
          (i.c as any)(arguments);
        };
        i.q = [];
        i.c = function(args: any){
          i.q.push(args);
        };
        w.Intercom = i;
        var l = function(){
          var s = d.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = 'https://widget.intercom.io/widget/cqwzmjsm';
          var x = d.getElementsByTagName('script')[0];
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
  }, []);

  return (
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
  );
}

export default ChatbotWidget;
