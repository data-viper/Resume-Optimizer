"use client";

export interface Resume {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  resumes: Resume[];
  loading: boolean;
  onActivate: (id: string) => void;
  onGoToProfile: () => void;
}

export default function ResumeSelector({ resumes, loading, onActivate, onGoToProfile }: Props) {
  const active = resumes.find((r) => r.isActive);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 h-full">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900">My Resumes</h2>
          <span className="text-xs text-gray-400">({resumes.length})</span>
        </div>
        <button
          onClick={onGoToProfile}
          className="text-xs text-indigo-600 font-medium hover:underline underline-offset-2"
        >
          Manage →
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">No resumes saved yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Add resumes in your profile</p>
          </div>
          <button
            onClick={onGoToProfile}
            className="mt-1 px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Resume
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1 overflow-auto">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                resume.isActive
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                resume.isActive ? "bg-indigo-100" : "bg-white border border-gray-200"
              }`}>
                <svg className={`w-4 h-4 ${resume.isActive ? "text-indigo-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${resume.isActive ? "text-indigo-700" : "text-gray-800"}`}>
                  {resume.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {resume.content.length.toLocaleString()} chars
                </p>
              </div>

              {resume.isActive ? (
                <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Active
                </span>
              ) : (
                <button
                  onClick={() => onActivate(resume.id)}
                  className="shrink-0 px-2 py-0.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 transition-colors"
                >
                  Set Active
                </button>
              )}
            </div>
          ))}

          <button
            onClick={onGoToProfile}
            className="mt-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Resume
          </button>
        </div>
      )}

      {active && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Optimizing with: <span className="font-medium text-indigo-600">{active.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
