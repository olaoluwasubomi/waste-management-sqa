"use client"
import Navigation from "./components/Navigation";
import StatsGrid from "./components/StatGrid";
import RequestOverTime from "./components/charts/RequestOverTime";
import RecentRequestsTable from "./components/RecentRequests";
import TopCollectorsTable from "./components/TopCollectors";
import RequestStatusChart from "./components/charts/RequestStatusChart";

export default function AdminPage() {
    return(
        <div>
            {/* <Navigation /> */}
            <StatsGrid />
            <div className="my-10 px-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RequestOverTime />
                <RecentRequestsTable />
            </div>
            <div className="my-4 px-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopCollectorsTable />
                <RequestStatusChart />
            </div>
        </div>
    )
}