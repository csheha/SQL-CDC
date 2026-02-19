import { Component, OnInit, PLATFORM_ID, Inject, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { embedDashboard } from '@superset-ui/embedded-sdk';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule], 
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  
  // Customer code (you can change this later)
  customerCode = 'CUST-000001';  // Default customer
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
  ngOnInit() {
    // Component initialization
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(async () => {
      await this.loadDashboard();
    }, 100);
  }

  // Separate method to load dashboard
  async loadDashboard() {
    try {
      console.log(`🚀 Loading dashboard for customer: ${this.customerCode}`);
      
      const container = document.getElementById('superset-container');
      if (!container) {
        console.error('❌ Container not found');
        return;
      }

      // Clear previous dashboard if reloading
      container.innerHTML = '';

      await embedDashboard({
        id: environment.dashboardId,
        supersetDomain: environment.supersetUrl,
        mountPoint: container,
        fetchGuestToken: () => this.getToken(),
        dashboardUiConfig: {
          hideTitle: false,
          hideTab: false,
          hideChartControls: false,
          // Pass URL parameters here
          urlParams: {
            customer_code: this.customerCode  // This becomes {{ url_param("customer_code") }}
          }
        }
      });

      console.log('✅ Dashboard embedded successfully');
    } catch (error) {
      console.error('❌ Error embedding dashboard:', error);
    }
  }

  async getToken(): Promise<string> {
    try {
      console.log('🔐 Fetching guest token from backend...');
      
      const response = await fetch(`${environment.apiUrl}/api/guest-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardId: environment.dashboardId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Token received');
      return data.token;
      
    } catch (error) {
      console.error('❌ Token fetch failed:', error);
      throw error;
    }
  }
}