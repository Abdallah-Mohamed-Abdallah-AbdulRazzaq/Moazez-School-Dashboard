import svgPaths from "./svg-bqrb7agf6j";
import imgImage9 from "./7065c6172fe2529d1f44d629e3d3051d52433d3b.png";
import imgImage10 from "./fa0203f5ad0253cd9bf026d5842c191b02d989ad.png";

function Group() {
  return (
    <div className="absolute inset-[12.5%_8.33%]" data-name="Group">
      <div className="absolute inset-[-4.17%_-3.75%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.5 19.5">
          <g id="Group">
            <path d={svgPaths.p396c6f00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.5" />
            <path d={svgPaths.pefb2b10} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function SolarWindLinear() {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px]" data-name="solar:wind-linear">
      <Group />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <SolarWindLinear />
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">Wind Status</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[#272727] content-stretch flex flex-col gap-[16px] items-end justify-end p-[16px] relative rounded-[16px] shrink-0">
      <Frame1 />
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[0px] text-white whitespace-nowrap">
        <span className="leading-[normal] text-[24px]">{`7.90 `}</span>
        <span className="leading-[normal] text-[14px]">km/h</span>
      </p>
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap">9:00 AM</p>
    </div>
  );
}

function CarbonHumidity() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="carbon:humidity">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="carbon:humidity">
          <path d={svgPaths.p3093a980} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <CarbonHumidity />
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">Humidity</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-[#272727] content-stretch flex flex-col gap-[16px] items-end justify-end px-[22px] py-[16px] relative rounded-[16px] shrink-0">
      <Frame4 />
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[0px] text-white whitespace-nowrap">
        <span className="leading-[normal] text-[24px]">{`85 `}</span>
        <span className="leading-[normal] text-[14px]">%</span>
      </p>
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap">Humidity is good</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[10px] items-start leading-[normal] not-italic relative shrink-0 text-white w-[100px]">
      <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-[16px] w-full">{`Sunrise `}</p>
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0 text-[24px] w-full">4:50 AM</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[#272727] content-stretch flex gap-[71px] items-center justify-center px-[16px] py-[35px] relative rounded-[24px] shrink-0">
      <div className="relative shrink-0 size-[64px]" data-name="image 9">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage9} />
      </div>
      <Frame6 />
    </div>
  );
}

function HugeiconsUv() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="hugeicons:uv-02">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="hugeicons:uv-02">
          <path d={svgPaths.p11327140} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <HugeiconsUv />
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">UV Index</p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-[#272727] content-stretch flex flex-col gap-[16px] items-end justify-end px-[27px] py-[16px] relative rounded-[16px] shrink-0">
      <Frame8 />
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[0px] text-white whitespace-nowrap">
        <span className="leading-[normal] text-[24px]">{`4 `}</span>
        <span className="leading-[normal] text-[14px]">UV</span>
      </p>
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap">Moderate UV</p>
    </div>
  );
}

function RiEyeLine() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="ri:eye-line">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="ri:eye-line">
          <path d={svgPaths.p648f9e0} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <RiEyeLine />
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">Visibility</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="bg-[#272727] content-stretch flex flex-col gap-[16px] items-end justify-end px-[30px] py-[16px] relative rounded-[16px] shrink-0">
      <Frame11 />
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[0px] text-white whitespace-nowrap">
        <span className="leading-[normal] text-[24px]">{`5 `}</span>
        <span className="leading-[normal] text-[14px]">km</span>
      </p>
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap">9:00 AM</p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[10px] items-start leading-[normal] not-italic relative shrink-0 text-white w-[100px]">
      <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-[16px] w-full">{`Sunset `}</p>
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold relative shrink-0 text-[24px] w-full">6:45 PM</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="bg-[#272727] content-stretch flex gap-[71px] items-center justify-center px-[16px] py-[35px] relative rounded-[24px] shrink-0">
      <div className="relative shrink-0 size-[64px]" data-name="image 10">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage10} />
      </div>
      <Frame13 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="absolute content-start flex flex-wrap gap-[18px] items-start left-[24px] top-[77px] w-[616px]">
      <Frame2 />
      <Frame3 />
      <Frame7 />
      <Frame5 />
      <Frame10 />
      <Frame12 />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute bg-[#1e1e1e] h-[387px] left-0 rounded-[24px] top-0 w-[664px]" />
      <Frame9 />
      <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] left-[24px] not-italic text-[24px] text-white top-[24px] whitespace-nowrap">Today’s Highlight</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <Group1 />
    </div>
  );
}