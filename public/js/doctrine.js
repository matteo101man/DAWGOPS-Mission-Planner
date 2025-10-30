// public/js/doctrine.js
document.addEventListener('DOMContentLoaded', function() {
    // Doctrine reference based on US Army ATP 3-21.8, FM 3-90, and ATP 3-21.10
    const doctrineReference = {
      'attack': {
        title: 'Attack',
        description: 'An offensive task that destroys or defeats enemy forces, seizes and secures terrain, or both.',
        characteristics: [
          'Uses direct fire, maneuver, and movement combined with supporting assets',
          'Usually conducted with speed, firepower, and violence of action',
          'Requires detailed planning, coordination, and rehearsals'
        ],
        key_planning_steps: [
          'Select avenues of approach and decisive points',
          'Determine enemy defensive positions or strength',
          'Plan for breaching obstacles',
          'Develop scheme of maneuver and establish control measures',
          'Integrate direct and indirect fires',
          'Designate assault, support, and breach elements'
        ],
        implementation: 'Attack operations typically involve an Objective Rally Point (ORP), a Release Point (RP), and a clearly defined objective. Units establish security and support positions before commencing the assault phase. Once the objective is secure, units consolidate and reorganize to maintain control of the seized area.'
      },
      'ambush': {
        title: 'Ambush',
        description: 'A surprise attack by fire from concealed positions on a moving or temporarily halted enemy.',
        characteristics: [
          'Maximizes surprise and shock',
          'Uses terrain to canalize or trap the enemy',
          'Typically short duration',
          'Can be linear, L-shaped, or other configurations'
        ],
        key_planning_steps: [
          'Select and reconnoiter the ambush site',
          'Establish security, support, and assault positions',
          'Plan for initiation of the ambush (signal)',
          'Develop a scheme for withdrawal',
          'Rehearse extensively'
        ],
        implementation: 'Ambush operations require establishing an ORP away from the ambush site, silent movement to ambush positions, and disciplined execution. The assault element establishes a kill zone, while security elements provide early warning and prevent enemy escape. The ambush is initiated with the most casualty-producing weapon, followed by a pre-planned sequence of fires.'
      },
      'raid': {
        title: 'Raid',
        description: 'An operation to temporarily seize an area to secure information, confuse an adversary, capture personnel or equipment, or destroy a capability culminating in a planned withdrawal.',
        characteristics: [
          'Temporary in nature with a planned withdrawal',
          'Often conducted in enemy-held territory',
          'Requires detailed intelligence and planning',
          'Speed and surprise are critical'
        ],
        key_planning_steps: [
          'Develop detailed intelligence of the objective',
          'Plan infiltration routes and exfiltration routes separately',
          'Establish clear abort criteria',
          'Designate assault, support, and security elements',
          'Rehearse contingency actions'
        ],
        implementation: 'Raid operations follow a sequence from assembly area to ORP, to Release Point, to the objective. The unit withdraws along a different route than it used for infiltration when possible. Security elements are critical to protect the main assault element during the mission and especially during withdrawal.'
      },
      'reconnaissance': {
        title: 'Reconnaissance',
        description: 'A mission undertaken to obtain, by visual observation or other detection methods, information about the activities and resources of an enemy or adversary.',
        characteristics: [
          'Emphasizes stealth and avoiding detection',
          'Focus on information collection, not direct engagement',
          'Continuous and aggressive',
          'Report information accurately and timely'
        ],
        key_planning_steps: [
          'Determine specific information requirements (PIR)',
          'Establish observation posts or reconnaissance routes',
          'Plan for contingency actions if compromised',
          'Develop communication plan for reporting',
          'Consider use of special equipment (optics, sensors)'
        ],
        implementation: 'Reconnaissance operations often use OPs (observation posts) to maintain surveillance of NAIs (Named Areas of Interest). Units maintain secure communications to report information while avoiding detection and engagement with enemy forces unless necessary.'
      },
      'movement-to-contact': {
        title: 'Movement to Contact',
        description: 'An offensive task designed to develop the situation and establish or regain contact with the enemy.',
        characteristics: [
          'Emphasis on finding the enemy while retaining freedom of maneuver',
          'Balance between security and speed of movement',
          'Organized to rapidly develop the situation upon contact',
          'Uses advance, flank, and rear security elements'
        ],
        key_planning_steps: [
          'Organize movement formation (usually with advance guard)',
          'Plan for actions on contact',
          'Establish control measures and phase lines',
          'Prepare for transition to other operations',
          'Maintain momentum while ensuring security'
        ],
        implementation: 'Movement to contact operations involve security elements forward to maintain contact with the enemy. Units deploy with main body and security elements, typically using traveling overwatch or bounding overwatch techniques depending on the likelihood of enemy contact.'
      },
      'defense': {
        title: 'Defense',
        description: 'A task conducted to defeat an enemy attack, gain time, economize forces, and develop conditions favorable for offensive or stability tasks.',
        characteristics: [
          'Employs security, main battle, and reserve areas',
          'Uses prepared positions, obstacles, and counterattacks',
          'Maximizes use of terrain',
          'Includes depth, mutually supporting positions, and all-around security'
        ],
        key_planning_steps: [
          'Select and prepare primary, alternate, and supplementary positions',
          'Develop engagement areas and fire plans',
          'Integrate obstacles and barriers',
          'Plan for counterattack options',
          'Rehearse defensive positions and transitions'
        ],
        implementation: 'Defensive operations are organized in depth with security forces forward of main battle positions. The defense typically includes fallback positions, obstacle belts, and mutually supporting defensive positions. Patrol bases may be established to consolidate forces during extended defensive operations.'
      }
    };
  
    // Populate the doctrine reference section
    function populateDoctrineReference() {
      const referenceContent = document.getElementById('mission-reference');
      
      if (!referenceContent) return;
      
      let content = '';
      
      Object.keys(doctrineReference).forEach(missionType => {
        const mission = doctrineReference[missionType];
        
        content += `
          <div class="mission-reference-item">
            <h3>${mission.title}</h3>
            <p><strong>Description:</strong> ${mission.description}</p>
            
            <h4>Key Characteristics:</h4>
            <ul>
              ${mission.characteristics.map(char => `<li>${char}</li>`).join('')}
            </ul>
            
            <h4>Planning Considerations:</h4>
            <ul>
              ${mission.key_planning_steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
            
            <p><strong>Implementation:</strong> ${mission.implementation}</p>
          </div>
        `;
      });
      
      referenceContent.innerHTML = content;
    }
    
    // Link to mission type dropdown
    function linkMissionTypeToReference() {
      const missionTypeSelect = document.getElementById('mission-type');
      
      if (!missionTypeSelect) return;
      
      missionTypeSelect.addEventListener('change', function() {
        const selectedMission = this.value;
        
        // If user is on another tab, switch to reference tab
        if (!document.getElementById('reference').classList.contains('active')) {
          // Find tab buttons
          const referenceTabBtn = document.querySelector('.tab-btn[data-tab="reference"]');
          if (referenceTabBtn) {
            // Trigger click event
            referenceTabBtn.click();
          }
        }
        
        // Scroll to the selected mission
        const missionElements = document.querySelectorAll('.mission-reference-item h3');
        
        missionElements.forEach(element => {
          if (element.textContent.toLowerCase() === doctrineReference[selectedMission].title.toLowerCase()) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight the section temporarily
            element.parentElement.style.backgroundColor = '#f0f9ff';
            setTimeout(() => {
              element.parentElement.style.backgroundColor = '';
            }, 2000);
          }
        });
      });
    }
    
    // Initialize
    populateDoctrineReference();
    linkMissionTypeToReference();
  });