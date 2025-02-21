import { Card } from 'primereact/card';

const Credits: React.FC = () => {
  return (
    <Card className="mt-3">
      <h3 className="text-center mb-4">Hall of Fame</h3>
      <div className="grid">
        <div className="col-6">
          <div className="surface-card p-3 border-round">
            <div className="text-center mb-3">
              <i className="pi pi-users text-xl text-primary"></i>
              <h4 className="mt-2 mb-1">Testers</h4>
            </div>
            <div className="flex flex-column align-items-center gap-3">
              <div className="contributor-card flex align-items-center gap-2 p-2 border-round surface-hover cursor-pointer w-full justify-content-center">
                <img
                  src="./duckocore.png"
                  alt="Duckocore"
                  className="w-2rem h-2rem border-circle shadow-1"
                  style={{ objectFit: 'cover' }}
                />
                <span className="font-semibold">Bret</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6">
          <div className="surface-card p-3 border-round">
            <div className="text-center mb-3">
              <i className="pi pi-star text-xl text-yellow-500"></i>
              <h4 className="mt-2 mb-1">Contributors</h4>
            </div>
            <div className="flex flex-column align-items-center gap-3">
              <div className="contributor-card flex align-items-center gap-2 p-2 border-round surface-hover cursor-pointer w-full justify-content-center">
                <img
                  src="./duckocore.png"
                  alt="Duckocore"
                  className="w-2rem h-2rem border-circle shadow-1"
                  style={{ objectFit: 'cover' }}
                />
                <span className="font-semibold">Fyt</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Credits;
