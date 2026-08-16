import svgPaths from "./svg-dafd7h8epw";
import imgRainCloud from "./9c04c5661aa7a2982599e89fe2d8569d468e5733.png";

function FluentLocation20Regular() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="fluent:location-20-regular">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="fluent:location-20-regular">
          <path d={svgPaths.p250d9b00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute bg-[#363636] content-stretch flex gap-[8px] items-center justify-center left-[24px] px-[16px] py-[8px] rounded-[16px] top-[24px]">
      <FluentLocation20Regular />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">Dhaka, Bangladesh</p>
    </div>
  );
}

function TablerTemperatureCelsius() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="tabler:temperature-celsius">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="tabler:temperature-celsius">
          <path d={svgPaths.p303dd900} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function IconamoonArrowDown2Duotone() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="iconamoon:arrow-down-2-duotone">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="iconamoon:arrow-down-2-duotone">
          <path d={svgPaths.p19411800} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute bg-[#363636] content-stretch flex items-end justify-center left-[476px] p-[8px] rounded-[16px] top-[24px]">
      <TablerTemperatureCelsius />
      <IconamoonArrowDown2Duotone />
    </div>
  );
}

function Frame4() {
  return (
    <div className="-translate-y-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[4px] items-start leading-[normal] left-[24px] not-italic text-white top-[calc(50%-51.5px)]">
      <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-[36px] whitespace-nowrap">Sunday</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal min-w-full relative shrink-0 text-[16px] w-[min-content]">04 Aug,2024</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="relative shrink-0 size-[150px]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[137px] left-1/2 top-[calc(50%+0.5px)] w-[142px]" data-name="Rain cloud">
        <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgRainCloud} />
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Medium',sans-serif] font-medium items-end relative shrink-0 w-[97px]">
      <p className="relative shrink-0 text-[40px] text-white w-full">28°C</p>
      <p className="relative shrink-0 text-[#b9b9b9] text-[24px] text-right w-full">/24°C</p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[7px] items-start relative shrink-0 text-white w-full">
      <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-[20px] w-[107px]">Heavy Rain</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[16px] text-center whitespace-nowrap">Feels like 31°</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[45px] items-start leading-[normal] not-italic relative shrink-0">
      <Frame7 />
      <Frame5 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="absolute content-stretch flex gap-[93px] items-center left-[182px] top-[118px]">
      <Frame6 />
      <Frame8 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute bg-[#1e1e1e] h-[314px] left-0 rounded-[24px] top-0 w-[556px]" />
      <Frame2 />
      <Frame3 />
      <Frame4 />
      <Frame9 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute h-[314px] left-0 top-0 w-[556px]">
      <Group />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <Frame1 />
    </div>
  );
}