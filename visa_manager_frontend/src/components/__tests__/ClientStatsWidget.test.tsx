// Unit tests for ClientStatsWidget component
// Testing the client statistics dashboard widget

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import ClientStatsWidget from '../ClientStatsWidget';
import { ClientStats } from '../../types/Client';

// Mock theme
jest.mock('../../styles/theme', () => ({
  theme: {
    colors: {
      primary: '#6200EE'
    }
  }
}));

const mockStats: ClientStats = {
  totalClients: 15,
  pending: 3,
  inProgress: 4,
  underReview: 2,
  completed: 3,
  approved: 2,
  rejected: 1,
  documentsRequired: 0
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      {component}
    </PaperProvider>
  );
};

describe('ClientStatsWidget', () => {
  describe('Loading State', () => {
    it('should display loading indicator when loading is true', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={null} 
          loading={true}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.getByText('Client Statistics')).toBeTruthy();
      expect(screen.getByText('Loading client statistics...')).toBeTruthy();
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('should not display stats when loading', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={mockStats} 
          loading={true}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.queryByText('15')).toBeFalsy(); // Total clients count should not be visible
      expect(screen.getByText('Loading client statistics...')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should display no data message when stats is null and not loading', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={null} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.getByText('Client Statistics')).toBeTruthy();
      expect(screen.getByText('No client statistics available')).toBeTruthy();
    });

    it('should not display progress bar when no stats available', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={null} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.queryByText('Completion Progress')).toBeFalsy();
    });
  });

  describe('Stats Display', () => {
    it('should display all client statistics correctly', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={mockStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      // Check main stats
      expect(screen.getByText('15')).toBeTruthy(); // Total clients
      expect(screen.getByText('5')).toBeTruthy(); // Completed (3 + 2)
      expect(screen.getByText('Total Clients')).toBeTruthy();
      expect(screen.getByText('Completed')).toBeTruthy();

      // Check status breakdown
      expect(screen.getByText('3')).toBeTruthy(); // Pending
      expect(screen.getByText('4')).toBeTruthy(); // In Progress
      expect(screen.getByText('2')).toBeTruthy(); // Under Review (appears twice - individual and approved)
      expect(screen.getByText('1')).toBeTruthy(); // Rejected
      expect(screen.getByText('0')).toBeTruthy(); // Documents Required

      // Check labels
      expect(screen.getByText('Pending')).toBeTruthy();
      expect(screen.getByText('In Progress')).toBeTruthy();
      expect(screen.getByText('Under Review')).toBeTruthy();
      expect(screen.getByText('Approved')).toBeTruthy();
      expect(screen.getByText('Rejected')).toBeTruthy();
      expect(screen.getByText('Docs Required')).toBeTruthy();
    });

    it('should calculate completion rate correctly', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={mockStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      // Completion rate should be (completed + approved) / total = (3 + 2) / 15 = 33%
      expect(screen.getByText('5 of 15 clients completed (33%)')).toBeTruthy();
      expect(screen.getByText('Completion Progress')).toBeTruthy();
    });

    it('should handle zero total clients gracefully', () => {
      const emptyStats: ClientStats = {
        totalClients: 0,
        pending: 0,
        inProgress: 0,
        underReview: 0,
        completed: 0,
        approved: 0,
        rejected: 0,
        documentsRequired: 0
      };

      renderWithProvider(
        <ClientStatsWidget 
          stats={emptyStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.getByText('0')).toBeTruthy(); // Should appear multiple times
      expect(screen.getByText('0 of 0 clients completed (0%)')).toBeTruthy();
    });

    it('should display 100% completion rate when all clients are completed', () => {
      const completedStats: ClientStats = {
        totalClients: 10,
        pending: 0,
        inProgress: 0,
        underReview: 0,
        completed: 5,
        approved: 5,
        rejected: 0,
        documentsRequired: 0
      };

      renderWithProvider(
        <ClientStatsWidget 
          stats={completedStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.getByText('10 of 10 clients completed (100%)')).toBeTruthy();
    });
  });

  describe('Progress Bar', () => {
    it('should show progress bar when showProgress is true', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={mockStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.getByText('Completion Progress')).toBeTruthy();
      expect(screen.getByText('5 of 15 clients completed (33%)')).toBeTruthy();
    });

    it('should hide progress bar when showProgress is false', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={mockStats} 
          loading={false}
          showProgress={false}
          showStatusBreakdown={true}
        />
      );

      expect(screen.queryByText('Completion Progress')).toBeFalsy();
      expect(screen.queryByText('5 of 15 clients completed (33%)')).toBeFalsy();
    });
  });

  describe('Status Breakdown Chips', () => {
    it('should show status chips when showStatusBreakdown is true and clients exist', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={mockStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.getByText('3 Pending')).toBeTruthy();
      expect(screen.getByText('4 In Progress')).toBeTruthy();
      expect(screen.getByText('2 Under Review')).toBeTruthy();
      expect(screen.getByText('2 Approved')).toBeTruthy();
      expect(screen.getByText('3 Completed')).toBeTruthy();
      expect(screen.getByText('1 Rejected')).toBeTruthy();
      // Documents Required should not appear since it's 0
      expect(screen.queryByText('0 Docs Needed')).toBeFalsy();
    });

    it('should hide status chips when showStatusBreakdown is false', () => {
      renderWithProvider(
        <ClientStatsWidget 
          stats={mockStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={false}
        />
      );

      expect(screen.queryByText('3 Pending')).toBeFalsy();
      expect(screen.queryByText('4 In Progress')).toBeFalsy();
      expect(screen.queryByText('2 Under Review')).toBeFalsy();
    });

    it('should only show chips for non-zero status counts', () => {
      const partialStats: ClientStats = {
        totalClients: 5,
        pending: 2,
        inProgress: 0,
        underReview: 0,
        completed: 3,
        approved: 0,
        rejected: 0,
        documentsRequired: 0
      };

      renderWithProvider(
        <ClientStatsWidget 
          stats={partialStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.getByText('2 Pending')).toBeTruthy();
      expect(screen.getByText('3 Completed')).toBeTruthy();
      
      // These should not appear since they're 0
      expect(screen.queryByText('0 In Progress')).toBeFalsy();
      expect(screen.queryByText('0 Under Review')).toBeFalsy();
      expect(screen.queryByText('0 Approved')).toBeFalsy();
      expect(screen.queryByText('0 Rejected')).toBeFalsy();
    });

    it('should not show status chips when no clients exist', () => {
      const emptyStats: ClientStats = {
        totalClients: 0,
        pending: 0,
        inProgress: 0,
        underReview: 0,
        completed: 0,
        approved: 0,
        rejected: 0,
        documentsRequired: 0
      };

      renderWithProvider(
        <ClientStatsWidget 
          stats={emptyStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.queryByText(/Pending$/)).toBeFalsy();
      expect(screen.queryByText(/In Progress$/)).toBeFalsy();
      expect(screen.queryByText(/Under Review$/)).toBeFalsy();
    });
  });

  describe('Default Props', () => {
    it('should use default values for optional props', () => {
      renderWithProvider(
        <ClientStatsWidget stats={mockStats} />
      );

      // Should show progress and status breakdown by default
      expect(screen.getByText('Completion Progress')).toBeTruthy();
      expect(screen.getByText('3 Pending')).toBeTruthy();
    });

    it('should handle loading=false by default', () => {
      renderWithProvider(
        <ClientStatsWidget stats={mockStats} />
      );

      expect(screen.queryByText('Loading client statistics...')).toBeFalsy();
      expect(screen.getByText('15')).toBeTruthy(); // Should show stats
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers correctly', () => {
      const largeStats: ClientStats = {
        totalClients: 9999,
        pending: 1000,
        inProgress: 2000,
        underReview: 1500,
        completed: 2500,
        approved: 2000,
        rejected: 999,
        documentsRequired: 0
      };

      renderWithProvider(
        <ClientStatsWidget 
          stats={largeStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      expect(screen.getByText('9999')).toBeTruthy();
      expect(screen.getByText('4500')).toBeTruthy(); // Completed total
      expect(screen.getByText('4500 of 9999 clients completed (45%)')).toBeTruthy();
    });

    it('should handle decimal completion percentages correctly', () => {
      const decimalStats: ClientStats = {
        totalClients: 3,
        pending: 1,
        inProgress: 0,
        underReview: 0,
        completed: 1,
        approved: 1,
        rejected: 0,
        documentsRequired: 0
      };

      renderWithProvider(
        <ClientStatsWidget 
          stats={decimalStats} 
          loading={false}
          showProgress={true}
          showStatusBreakdown={true}
        />
      );

      // 2/3 = 66.67% should round to 67%
      expect(screen.getByText('2 of 3 clients completed (67%)')).toBeTruthy();
    });
  });
});