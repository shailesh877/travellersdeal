import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Step 0: Show background image only (0s to 1s)
        const timer1 = setTimeout(() => {
            setStep(1); // Step 1: Reveal foreground icon
        }, 1000);

        // Step 1: Keep icon visible for 2 seconds (total 3s), then complete
        const timer2 = setTimeout(() => {
            setStep(2); // Step 2: Trigger fade out
            setTimeout(() => {
                onComplete();
            }, 500); // 0.5s fade out animation
        }, 3000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onComplete]);

    return (
        <div 
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${step === 2 ? 'opacity-0' : 'opacity-100'}`}
            style={{ 
                // A beautiful travel-themed background image placeholder. Can be replaced with any specific image.
                backgroundImage: `url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')`,
            }}
        >
            {/* Dark overlay to make the logo pop */}
            <div className="absolute inset-0 bg-black/30"></div>
            
            {/* Foreground Logo */}
            <div className={`relative z-10 transition-all duration-700 transform ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                <img 
                    src="/logo.png" 
                    alt="App Logo" 
                    className="w-56 md:w-80 h-auto drop-shadow-2xl"
                />
            </div>
        </div>
    );
};

export default SplashScreen;
