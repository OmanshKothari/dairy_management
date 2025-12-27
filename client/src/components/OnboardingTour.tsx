/**
 * Onboarding Tour Component
 * 
 * Guides users through the initial setup process, ensuring they create a Source first.
 */

import React, { useEffect, useState } from 'react';
import { Tour, type TourProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const OnboardingTour: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [sourceCount, setSourceCount] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we need to show the tour
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get('/api/sources');
        if (response.data.success) {
           const count = response.data.data.length;
           setSourceCount(count);
           if (count === 0) {
             setOpen(true);
           }
        }
      } catch (error) {
        console.error('Failed to check source status', error);
      }
    };
    checkStatus();
  }, [location.pathname]); // Re-check on navigation? Or just once? 
  // Better to check once on mount, but if they navigate away without adding, we want to persist?
  // Let's stick to initial check or if they are on dashboard.

  // Steps configuration
  const steps: TourProps['steps'] = [
    {
      title: 'Welcome to Dairy Manager!',
      description: 'To get started, we need to set up your milk sources (Farms, Markets, etc.).',
      target: null, // Center screen
    },
    {
      title: 'Manage Sources',
      description: 'Click here to go to the Sources management page.',
      target: () => document.querySelector('[data-menu-id$="/sources"]') as HTMLElement,
      nextButtonProps: {
          onClick: () => navigate('/sources')
      }
    },
    {
        title: 'Add a Source',
        description: 'Click this button to add your first milk source.',
        target: () => document.getElementById('add-source-btn') as HTMLElement,
    }
  ];

  // If on /sources page, start at step 2 (index 2)
  // Logic: 
  // If count == 0:
  //   If not on /sources: Show Step 0 (Welcome) -> Step 1 (Point to Menu)
  //   If on /sources: Show Step 2 (Point to Add Button)

  // We need dynamic current step control
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
      if (sourceCount === 0) {
          if (location.pathname === '/sources') {
              setCurrentStep(2);
          } else if (currentStep === 2) {
              // If we were on step 2 but moved away, reset?
              setCurrentStep(0);
          }
      }
  }, [location.pathname, sourceCount]);

  const handleClose = () => {
      setOpen(false);
  };

  if (sourceCount !== 0) return null;

  return (
    <Tour 
      open={open} 
      onClose={handleClose} 
      steps={steps}
      current={currentStep}
      onChange={(current) => setCurrentStep(current)}
    />
  );
};

export default OnboardingTour;
