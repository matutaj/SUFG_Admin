import { SvgIcon, SvgIconProps } from '@mui/material';

const Categoria = (props: SvgIconProps) => {
  return (
    <SvgIcon width="18" height="16" viewBox="0 0 18 16" fill="none" {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-bookmark-fill"
        viewBox="0 0 16 16"
      >
        <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2" />
      </svg>
    </SvgIcon>
  );
};

export default Categoria;
