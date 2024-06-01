'use client';
import { useEffect } from 'react';
// @ts-ignore
import * as CookieConsent from "vanilla-cookieconsent";
import posthog from 'posthog-js'

export function ConsentRespectingPosthogAnalytics () {
  useEffect(() => {
    const updateConsent = () => {
      CookieConsent.acceptedCategory('analytics') ? acceptCookies() : declineCookies();
    };

    window.addEventListener('cc:onConsent', () => {
      updateConsent();
    });

    window.addEventListener('cc:onChange', () => {
      updateConsent();
    });
  }, [])

  return null
}

  
function acceptCookies () { 
  posthog.opt_in_capturing();
};

function declineCookies () {
  posthog.opt_out_capturing();
};