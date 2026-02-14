import { Component, ElementRef, HostListener, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Route, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
    @ViewChild('dropdown', { read: ElementRef }) dropdownRef?: ElementRef;

  isAuthenticated$: Observable<boolean>;
  currentUser$: Observable<User | null>;
  isDropdownOpen = false;

  isAdmin = false;
  isModerator = false;
  currentUserRole = 'user';

  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Subscribing to user changes to track admin status
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'admin';
      this.isModerator = user?.role === 'moderator';
      this.currentUserRole = user?.role || 'user';
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeDropdown();
    this.router.navigate(['/']);
  }

  getInitials(email: string): string {
    return email.substring(0, 2).toUpperCase();
  }
}