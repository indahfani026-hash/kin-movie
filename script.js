function movieApp() {
  return {
    apiKey: 'MASUKKAN_API_KEY_KAMU',
    movies: [],
    search: '',
    year: '',
    category: 'popular',
    loading: false,
    error: '',
    selectedMovie: null,
    trailerMessage: '',
    requestNumber: 0,

    years: Array.from(
      { length: 2026 - 1980 + 1 },
      (_, i) => 2026 - i
    ),

    get pageTitle() {
      if (this.search.trim()) return 'Hasil Pencarian';
      if (this.category === 'now_playing') return 'Sedang Tayang';
      if (this.category === 'top_rated') return 'Rating Tertinggi';
      return 'Popular Movies';
    },

    async request(url) {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API key salah atau belum aktif.');
        }
        throw new Error('Gagal mengambil data. Periksa koneksi dan API key.');
      }

      return response.json();
    },

    async loadMovies() {
      const currentRequest = ++this.requestNumber;
      this.loading = true;
      this.error = '';

      try {
        let url;

        if (this.year) {
          const params = new URLSearchParams({
            api_key: this.apiKey,
            language: 'id-ID',
            page: '1',
            primary_release_year: this.year,
            sort_by: this.category === 'top_rated'
              ? 'vote_average.desc'
              : 'popularity.desc',
            'vote_count.gte': this.category === 'top_rated' ? '100' : '0'
          });

          if (this.category === 'now_playing') {
            params.set('primary_release_date.gte', this.year + '-01-01');
            params.set('primary_release_date.lte', this.year + '-12-31');
          }

          url = 'https://api.themoviedb.org/3/discover/movie?' + params;
        } else {
          url = 'https://api.themoviedb.org/3/movie/' +
            this.category + '?api_key=' + this.apiKey +
            '&language=id-ID&page=1';
        }

        const data = await this.request(url);
        if (currentRequest !== this.requestNumber) return;
        this.movies = (data.results || []).slice(0, 20);
      } catch (e) {
        if (currentRequest !== this.requestNumber) return;
        this.error = e.message;
        this.movies = [];
      } finally {
        if (currentRequest === this.requestNumber) {
          this.loading = false;
        }
      }
    },

    async setCategory(category) {
      this.category = category;
      if (this.search.trim()) {
        await this.searchMovies();
      } else {
        await this.loadMovies();
      }
    },

    async searchMovies() {
      const currentRequest = ++this.requestNumber;
      this.loading = true;
      this.error = '';

      try {
        if (!this.search.trim()) {
          if (currentRequest === this.requestNumber) {
            await this.loadMovies();
          }
          return;
        }

        const params = new URLSearchParams({
          api_key: this.apiKey,
          language: 'id-ID',
          query: this.search,
          page: '1'
        });

        if (this.year) {
          params.set('primary_release_year', this.year);
        }

        const data = await this.request(
          'https://api.themoviedb.org/3/search/movie?' + params
        );

        if (currentRequest !== this.requestNumber) return;
        this.movies = data.results || [];
      } catch (e) {
        if (currentRequest !== this.requestNumber) return;
        this.error = e.message;
        this.movies = [];
      } finally {
        if (currentRequest === this.requestNumber) {
          this.loading = false;
        }
      }
    },

    async openDetail(id) {
      this.loading = true;
      this.error = '';
      this.trailerMessage = '';

      try {
        this.selectedMovie = await this.request(
          'https://api.themoviedb.org/3/movie/' + id +
          '?api_key=' + this.apiKey + '&language=id-ID'
        );
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async openTrailer() {
      if (!this.selectedMovie) return;

      this.trailerMessage = 'Mencari trailer...';

      try {
        let data = await this.request(
          'https://api.themoviedb.org/3/movie/' +
          this.selectedMovie.id +
          '/videos?api_key=' + this.apiKey + '&language=id-ID'
        );

        let trailer = (data.results || []).find(
          v => v.site === 'YouTube' &&
          (v.type === 'Trailer' || v.type === 'Teaser') && v.key
        );

        if (!trailer) {
          data = await this.request(
            'https://api.themoviedb.org/3/movie/' +
            this.selectedMovie.id +
            '/videos?api_key=' + this.apiKey + '&language=en-US'
          );

          trailer = (data.results || []).find(
            v => v.site === 'YouTube' &&
            (v.type === 'Trailer' || v.type === 'Teaser') && v.key
          );
        }

        if (trailer) {
          window.open(
            'https://www.youtube.com/watch?v=' + trailer.key,
            '_blank',
            'noopener,noreferrer'
          );
          this.trailerMessage = '';
        } else {
          this.trailerMessage = 'Trailer tidak tersedia untuk film ini.';
        }
      } catch (e) {
        this.trailerMessage = 'Gagal mengambil trailer. Coba lagi.';
      }
    }
  };
}