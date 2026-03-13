"use client";

import Script from "next/script";

export default function GHLFormEmbed() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <div className="bg-hvac-navy p-4 text-center">
        <h3 className="text-white text-sm font-black uppercase tracking-widest m-0">Secure Service Request</h3>
      </div>
      <div className="p-2">
        <iframe
          src="https://api.hvacrevenueboost.com/widget/form/rgwcmDTeHu27A2MwprRk"
          style={{ width: "100%", height: "100%", border: "none", borderRadius: "3px" }}
          id="inline-rgwcmDTeHu27A2MwprRk"
          data-layout="{'id':'INLINE'}"
          data-trigger-type="alwaysShow"
          data-trigger-value=""
          data-activation-type="alwaysActivated"
          data-activation-value=""
          data-deactivation-type="neverDeactivate"
          data-deactivation-value=""
          data-form-name="HVAC Service Request "
          data-height="1150"
          data-layout-iframe-id="inline-rgwcmDTeHu27A2MwprRk"
          data-form-id="rgwcmDTeHu27A2MwprRk"
          title="HVAC Service Request "
          className="min-h-[1150px]"
        ></iframe>
        <Script 
          src="https://api.hvacrevenueboost.com/js/form_embed.js" 
          strategy="lazyOnload"
        />
      </div>
    </div>
  );
}
