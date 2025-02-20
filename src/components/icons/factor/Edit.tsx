import { SvgIcon, SvgIconProps } from '@mui/material';

const Edit = (props: SvgIconProps) => {
  return (
    <SvgIcon width="20" height="21" viewBox="0 0 20 21" fill="none" {...props}>
      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        >
          <path strokeDasharray={20} strokeDashoffset={20} d="M3 21h18">
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              dur="0.2s"
              values="20;0"
            ></animate>
          </path>
          <path strokeDasharray={48} strokeDashoffset={48} d="M7 17v-4l10 -10l4 4l-10 10h-4">
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.2s"
              dur="0.6s"
              values="48;0"
            ></animate>
          </path>
          <path strokeDasharray={8} strokeDashoffset={8} d="M14 6l4 4">
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.8s"
              dur="0.2s"
              values="8;0"
            ></animate>
          </path>
        </g>
        <path fill="currentColor" fillOpacity={0} d="M14 6l4 4L21 7L17 3Z">
          <animate
            fill="freeze"
            attributeName="fill-opacity"
            begin="1.1s"
            dur="0.5s"
            values="0;1"
          ></animate>
        </path>
      </svg>
    </SvgIcon>
  );
};

export default Edit;
