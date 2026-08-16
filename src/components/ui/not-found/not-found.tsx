import { useTranslations } from 'next-intl';
import Link from 'next/link';
export default function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4">
      
      {/* 1. شبكة خلفية متحركة لا نهائية */}
      <div className="animated-grid absolute inset-0 z-0 opacity-40 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center">
        
        {/* 2. منطقة الأنيميشن المداري (Orbit Rings) والشعار */}
        <div className="relative flex h-64 w-64 items-center justify-center mb-6">
          
          {/* الحلقة الخارجية (تدور مع عقارب الساعة) */}
          <div className="absolute inset-0 rounded-full border-4 border-b-[#036C80] border-l-transparent border-r-transparent border-t-[#036C80] animate-[spin_6s_linear_infinite] opacity-60"></div>
          
          {/* الحلقة الداخلية (تدور عكس عقارب الساعة) */}
          <div className="absolute inset-6 rounded-full border-4 border-b-transparent border-l-[#13B3B0] border-r-[#13B3B0] border-t-transparent animate-[spin_4s_linear_infinite_reverse] opacity-80"></div>
          
          {/* الشعار في المنتصف مع تأثير النبض */}
          <div className="relative z-20 flex h-36 w-36 items-center justify-center rounded-full bg-white shadow-2xl shadow-[#13B3B0]/20 animate-logo-pulse">
            <svg width="85" height="42" viewBox="0 0 97 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_838_5504)">
                <path d="M58.6782 17.2496H45.9254C44.6044 17.2496 42.6394 19.1485 43.1029 20.5927H70.7479C71.0669 20.5927 71.2565 17.6805 71.422 17.0238C73.6698 8.10611 85.0715 4.85818 92.1791 10.5695C100.984 17.6419 96.9847 31.2993 86.0735 33.2783C79.5166 32.892 72.2435 33.8548 65.7708 33.3051C63.9202 33.1476 62.1749 32.2918 60.8388 31.0437C60.5048 30.7317 59.1537 28.8507 59.0092 28.8418C58.4977 28.818 58.7203 30.7436 58.6572 31.1626C58.5428 31.9114 57.4896 33.2932 56.7524 33.2932H29.333V38.3092C29.333 41.6255 24.7621 45.9996 21.5453 45.9996H16.2432V20.9255C16.2432 18.153 20.7719 13.9037 23.5795 13.9037H29.333V20.3668H33.1696C33.5969 5.42872 54.6941 2.79293 58.6722 17.2467L58.6782 17.2496ZM87.1689 20.5422C87.1689 18.7919 85.7305 17.3715 83.9581 17.3715C82.1857 17.3715 80.7473 18.7919 80.7473 20.5422C80.7473 22.2924 82.1857 23.7128 83.9581 23.7128C85.7305 23.7128 87.1689 22.2924 87.1689 20.5422Z" fill="#036C80"/>
                <path d="M13.0898 13.9072V38.5356C13.0898 41.6231 8.67538 46.0002 5.53082 46.0002H0V21.1519C0 18.1655 4.53479 13.9072 7.55899 13.9072H13.0898Z" fill="#036C80"/>
                <path d="M24.0044 10.4778C26.9343 10.4778 29.3095 8.13225 29.3095 5.23889C29.3095 2.34553 26.9343 0 24.0044 0C21.0744 0 18.6992 2.34553 18.6992 5.23889C18.6992 8.13225 21.0744 10.4778 24.0044 10.4778Z" fill="#036C80"/>
                <path d="M7.1108 10.7747C10.0407 10.7747 12.4159 8.42912 12.4159 5.53576C12.4159 2.64241 10.0407 0.296875 7.1108 0.296875C4.18085 0.296875 1.80566 2.64241 1.80566 5.53576C1.80566 8.42912 4.18085 10.7747 7.1108 10.7747Z" fill="#13B3B0"/>
              </g>
              <defs>
                <clipPath id="clip0_838_5504"><rect width="97" height="46" fill="white"/></clipPath>
              </defs>
            </svg>
          </div>
        </div>

        {/* 3. نص 404 بتأثير الطبقات المتراكبة (Digital Layering) */}
        <div className="relative mb-4">
          <h1 className="text-8xl font-black text-[#036C80] tracking-widest sm:text-9xl relative z-10">
            404
          </h1>
          {/* ظل لوني متحرك خلف الرقم */}
          <span className="absolute -left-2 -top-2 z-0 text-8xl font-black text-[#13B3B0] tracking-widest opacity-40 blur-[2px] sm:text-9xl animate-glitch-slide">
            404
          </span>
        </div>

        {/* 4. النصوص والأزرار */}
        <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl">{t('title')}</h2>
        <p className="mt-4 max-w-md text-lg text-gray-500">{t('description')}</p>

        <Link
          href="/"
          className="mt-8 flex items-center gap-3 rounded-full bg-[#036C80] px-8 py-4 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#13B3B0] hover:shadow-[#13B3B0]/40 hover:ring-4 hover:ring-[#13B3B0]/20 active:translate-y-0"
        >
          {t('backToHome')}
        </Link>
      </div>

      {/* كود الـ CSS للحركات التفاعلية */}
      <style>{`
        /* حركة الشبكة الخلفية */
        @keyframes panGrid {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .animated-grid {
          background-image: 
            linear-gradient(to right, rgba(19, 179, 176, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(19, 179, 176, 0.15) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: panGrid 3s linear infinite;
        }

        /* حركة النبض الخاصة بالشعار */
        @keyframes logoPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(19, 179, 176, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(19, 179, 176, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(19, 179, 176, 0); }
        }
        .animate-logo-pulse {
          animation: logoPulse 2.5s infinite;
        }

        /* حركة الظل الرقمي للرقم 404 */
        @keyframes glitchSlide {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-8px, 4px); }
          100% { transform: translate(0, 0); }
        }
        .animate-glitch-slide {
          animation: glitchSlide 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
















































// import React from 'react';
// import { useTranslations } from 'next-intl';
// import Link from 'next/link';

// export default function NotFoundPage() {
//   const t = useTranslations('NotFound');

//   return (
//     <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center overflow-hidden">
      
//       {/* قسم الأنيميشن المصمم بـ CSS */}
//       <div className="relative mb-12 flex items-center justify-center">
//         {/* رقم 404 كخلفية كبيرة جداً وشفافة */}
//         <h1 className="absolute text-[12rem] font-extrabold text-[#13B3B0]/10 select-none">
//           404
//         </h1>
        
//         {/* الدوائر المتموجة (Ripple Effect) */}
//         <div className="absolute h-48 w-48 rounded-full border-2 border-[#13B3B0]/30 animate-ping" style={{ animationDuration: '3s' }}></div>
//         <div className="absolute h-64 w-64 rounded-full border border-[#036C80]/20 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>

//         {/* الشعار مع حركة الطفو (Floating) */}
//         <div className="moazez-float relative z-10 flex h-36 w-36 items-center justify-center rounded-full bg-white shadow-xl shadow-[#13B3B0]/20">
//           <svg width="80" height="40" viewBox="0 0 97 46" fill="none" xmlns="http://www.w3.org/2000/svg">
//             <g clipPath="url(#clip0_838_5504)">
//               <path d="M58.6782 17.2496H45.9254C44.6044 17.2496 42.6394 19.1485 43.1029 20.5927H70.7479C71.0669 20.5927 71.2565 17.6805 71.422 17.0238C73.6698 8.10611 85.0715 4.85818 92.1791 10.5695C100.984 17.6419 96.9847 31.2993 86.0735 33.2783C79.5166 32.892 72.2435 33.8548 65.7708 33.3051C63.9202 33.1476 62.1749 32.2918 60.8388 31.0437C60.5048 30.7317 59.1537 28.8507 59.0092 28.8418C58.4977 28.818 58.7203 30.7436 58.6572 31.1626C58.5428 31.9114 57.4896 33.2932 56.7524 33.2932H29.333V38.3092C29.333 41.6255 24.7621 45.9996 21.5453 45.9996H16.2432V20.9255C16.2432 18.153 20.7719 13.9037 23.5795 13.9037H29.333V20.3668H33.1696C33.5969 5.42872 54.6941 2.79293 58.6722 17.2467L58.6782 17.2496ZM87.1689 20.5422C87.1689 18.7919 85.7305 17.3715 83.9581 17.3715C82.1857 17.3715 80.7473 18.7919 80.7473 20.5422C80.7473 22.2924 82.1857 23.7128 83.9581 23.7128C85.7305 23.7128 87.1689 22.2924 87.1689 20.5422Z" fill="#036C80"/>
//               <path d="M13.0898 13.9072V38.5356C13.0898 41.6231 8.67538 46.0002 5.53082 46.0002H0V21.1519C0 18.1655 4.53479 13.9072 7.55899 13.9072H13.0898Z" fill="#036C80"/>
//               <path d="M24.0044 10.4778C26.9343 10.4778 29.3095 8.13225 29.3095 5.23889C29.3095 2.34553 26.9343 0 24.0044 0C21.0744 0 18.6992 2.34553 18.6992 5.23889C18.6992 8.13225 21.0744 10.4778 24.0044 10.4778Z" fill="#036C80"/>
//               <path d="M7.1108 10.7747C10.0407 10.7747 12.4159 8.42912 12.4159 5.53576C12.4159 2.64241 10.0407 0.296875 7.1108 0.296875C4.18085 0.296875 1.80566 2.64241 1.80566 5.53576C1.80566 8.42912 4.18085 10.7747 7.1108 10.7747Z" fill="#13B3B0"/>
//             </g>
//             <defs>
//               <clipPath id="clip0_838_5504"><rect width="97" height="46" fill="white"/></clipPath>
//             </defs>
//           </svg>
//         </div>
//       </div>

//       <h2 className="mt-4 text-3xl font-bold text-[#036C80]">{t('title')}</h2>
//       <p className="mt-4 max-w-lg text-lg text-gray-600">{t('description')}</p>

//       <Link
//         href="/"
//         className="mt-8 inline-flex items-center justify-center rounded-full bg-[#13B3B0] px-8 py-3 text-base font-medium text-white shadow-md transition-all hover:-translate-y-1 hover:bg-[#036C80] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#13B3B0]/50"
//       >
//         {t('backToHome')}
//       </Link>

//       {/* كود الحركة المخصص */}
//       <style>{`
//         @keyframes float {
//           0% { transform: translateY(0px); }
//           50% { transform: translateY(-15px); }
//           100% { transform: translateY(0px); }
//         }
//         .moazez-float {
//           animation: float 4s ease-in-out infinite;
//         }
//       `}</style>
//     </div>
//   );
// }