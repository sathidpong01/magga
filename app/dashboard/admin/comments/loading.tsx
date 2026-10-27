"use client";
import { useSearchParams } from "next/navigation";
import CommentsManager from "./CommentsManager";
export default function CommentsLoading() {
  const params=useSearchParams();
  const limit=params.get("limit")==="50"? 50:params.get("limit")==="100"? 100:20;
  return <CommentsManager loading initialComments={[]} initialPagination={{ page: 1,limit,total: 0,totalPages: 1 }} />;
}
