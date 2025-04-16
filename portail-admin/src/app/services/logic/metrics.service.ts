import { Injectable } from '@angular/core';
import { DISCOVER_DATA_TYPE, METRIC_TYPE } from '../../interfaces/discover-data-type';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {

  getMetricIcon(metric: DISCOVER_DATA_TYPE): string {
    const endpoint = metric.ENDPOINT.toLowerCase();
    const label = metric.LABEL_FR.toLowerCase();
    
    if (endpoint.includes('participant') || endpoint.includes('nb_participants') || 
        label.includes('inscrit') || label.includes('employé')) {
      return 'people';
    }
    
    if (endpoint.includes('active_user') || endpoint.includes('active') || 
        label.includes('actif') || label.includes('actifs')) {
      return 'person';
    }
    
    if (endpoint.includes('invitation') || label.includes('invitation')) {
      return 'mail';
    }
    
    if (endpoint.includes('conversion') || label.includes('conversion')) {
      return 'sync_alt';
    }
    
    if (endpoint.includes('mission') || label.includes('mission')) {
      return 'assignment';
    }
    
    if (endpoint.includes('collab') || label.includes('collaboration')) {
      return 'handshake';
    }
    
    if (endpoint.includes('activity') || label.includes('activité')) {
      return 'trending_up';
    }
    
    if (endpoint.includes('highfive') || endpoint.includes('high_five') || 
        label.includes('high five') || label.includes('félicitation')) {
      return 'front_hand';
    }
    
    if (endpoint.includes('comment') || label.includes('commentaire')) {
      return 'chat_bubble';
    }
    
    if (endpoint.includes('photo') || label.includes('photo')) {
      return 'photo_camera';
    }
    
    switch (metric.METRIC_TYPE) {
      case METRIC_TYPE.GLOBAL:
        return 'analytics';
        
      case METRIC_TYPE.INVITATION:
        return 'mail';
        
      case METRIC_TYPE.SOCIAL:
        return 'thumb_up';
        
      default:
        return 'insert_chart';
    }
  }

  getMetricColor(metric: DISCOVER_DATA_TYPE): string {
    let hue;
    
    switch(metric.METRIC_TYPE) {
      case METRIC_TYPE.GLOBAL:
        hue = 200; 
        break;
      case METRIC_TYPE.INVITATION:
        hue = 120; 
        break;
      case METRIC_TYPE.SOCIAL:
        hue = 280; 
        break;
      default:
        hue = 180; 
    }
    
    const saturation = 70 + Math.random() * 20;
    const lightness = 45 + Math.random() * 10;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
} 