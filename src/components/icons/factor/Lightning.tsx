import { SvgIcon, SvgIconProps } from '@mui/material';

const Lightning = (props: SvgIconProps) => {
  return (
    <SvgIcon width="20" height="21" viewBox="0 0 20 21" fill="none" {...props}>
      <g clipPath="url(#clip0_683_608)">
        <path
          d="M10 1L1 5.5V15.5L10 20L19 15.5V5.5L10 1ZM10 3L17 6.5L10 10L3 6.5L10 3ZM3 8L9 11.5V18L3 14.5V8ZM11 11.5L17 8V14.5L11 18V11.5Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_683_608">
          <rect width="20" height="20" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
};

export default Lightning;
