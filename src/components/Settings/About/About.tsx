import Credits from './Credits';
import GeneralInfo from './GeneralInfo';
import Libraries from './Libraries';

export const About: React.FC = () => {
  return (
    <div className="p-3">
      <GeneralInfo />
      <Libraries />
      <Credits />
    </div>
  );
};
