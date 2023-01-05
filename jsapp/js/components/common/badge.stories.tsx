import React from 'react';
import {ComponentStory, ComponentMeta} from '@storybook/react';

import {IconNames} from 'jsapp/fonts/k-icons';
import Badge, {BadgeColor, BadgeSize} from './badge';

const badgeColors: BadgeColor[] = [
  'cloud',
  'light-amber',
  'light-blue',
  'light-teal',
];
const badgeSizes: BadgeSize[] = ['s', 'm', 'l'];

export default {
  title: 'common/Badge',
  component: Badge,
  argTypes: {
    color: {
      options: badgeColors,
      control: {type: 'select'},
    },
    size: {
      options: badgeSizes,
      control: {type: 'select'},
    },
    icon: {
      options: IconNames,
      control: {type: 'select'},
    },
  },
} as ComponentMeta<typeof Badge>;

const Template: ComponentStory<typeof Badge> = (args) => <Badge {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  color: badgeColors[0],
  label: 'deployed',
  size: badgeSizes[0],
  icon: IconNames['project-deployed'],
};
