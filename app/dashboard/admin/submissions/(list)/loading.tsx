import SubmissionsManager from "../SubmissionsManager";
export default function SubmissionsLoading() {
  return <SubmissionsManager initialLoading initialSubmissions={[]} initialTotalPages={1} />;
}
