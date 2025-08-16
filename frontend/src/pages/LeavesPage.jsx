import LeaveForm from '../components/LeaveForm';

export default function LeavesPage() {
  const handleCreate = (form) => {

    console.log('Create Leave (UI only):', form);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <LeaveForm onSubmit={handleCreate} />
      {/* Below can go your list/history etc. */}
    </div>
  );
}
