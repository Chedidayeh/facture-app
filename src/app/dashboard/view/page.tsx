import { ChartLineRetention } from "./_components/ChartLineRetention";
import { ChartLineUsers } from "./_components/ChartLineUsers";
import { ScalpHealthPuchasesChartLine } from "./_components/ScalpHealthPuchasesChartLine";
import { SectionCards } from "./_components/section-cards";
import { WeeklySurveyChart } from "./_components/WeeklySurveyChart";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <SectionCards />
      <ChartLineUsers />
      <ChartLineRetention />
      <WeeklySurveyChart/>
      {/* <ScalpHealthPuchases/> */}
      {/* <ScalpHealthPuchasesChartLine/> */}
    </div>
  );
}
